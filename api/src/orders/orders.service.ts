import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CartService } from '../cart/cart.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { QueryOrdersDto } from './dto/query-orders-dto';
import { BadGatewayException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { Product } from '../products/entities/product.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly mailService: MailService,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}
  async checkout(user: User) {
    const cart = await this.cartService.getOrCreateCart(user);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      throw new BadRequestException('Carrinho vazio');
    }

    for (const item of cart.items) {
      if (!item.product.active) {
        errors.push(`"${item.product.name}" não está mais disponível`);
      } else if (item.quantity > item.product.stock) {
        errors.push(
          `"${item.product.name}": restam ${item.product.stock} unidade(s)`,
        );
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const orderItems = cart.items.map((item) =>
      this.dataSource.manager.create(OrderItem, {
        product: item.product,
        productName: item.product.name,
        unitPriceInCents: item.product.priceInCents,
        quantity: item.quantity,
      }),
    );

    const totalInCents = orderItems.reduce(
      (total, item) => total + item.unitPriceInCents * item.quantity,
      0,
    );

    const order = await this.dataSource.transaction(async (manager) => {
      const newOrder = manager.create(Order, {
        user,
        status: OrderStatus.PENDING,
        totalInCents,
        items: orderItems,
      });

      return manager.save(newOrder);
    });

    // Declara a variável que guardará o retorno da sessão do Stripe
    let session: Stripe.Checkout.Session;

    try {
      // Tenta chamar o PaymentsService para criar a sessão no Stripe
      session = await this.paymentsService.createCheckoutSession(order);
    } catch (error) {
      // 1. Registra o erro no sistema de logs
      this.logger.error(
        `Falha ao criar sessão do Stripe para o pedido ${order.id}`,
        error,
      );
      // 2. Atualiza o status do pedido no seu banco de dados para CANCELADO
      await this.orderRepository.update(order.id, {
        status: OrderStatus.CANCELED,
      });
      throw new BadGatewayException(
        'Não foi possível iniciar o pagamento. Tente novamente.',
      );
    }
    // Salva o ID da sessão do Stripe no banco de dados
    await this.orderRepository.update(order.id, {
      stripeSessionId: session.id,
    });

    return {
      id: order.id,
      status: order.status,
      totalInCents: order.totalInCents,
      checkoutUrl: session.url,
    };
  }

  async findAll(user: User, { page = 1, limit = 10 }: QueryOrdersDto) {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { user: { id: user.id } },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findOne(user: User, id: number) {
    const order = await this.orderRepository.findOne({
      where: {
        id,
        user: { id: user.id }, // Filtra por ID do pedido e ID do usuário logado juntos
      },
      relations: {
        items: {
          product: true, // Carrega os itens do pedido com seus respectivos produtos
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${id} não encontrado`);
    }

    return this.formatOrder(order);
  }

  private formatOrder(order: Order) {
    const items = order.items.map((item) => {
      const subtotal = item.quantity * item.unitPriceInCents;

      return {
        name: item.product.name,
        unitPriceInCents: item.unitPriceInCents,
        quantity: item.quantity,
        subtotal,
      };
    });

    return {
      id: order.id,
      status: order.status,
      totalInCents: order.totalInCents,
      createdAt: order.createdAt,
      items, // Retorna o array de itens mapeados acima
    };
  }

  async processOrderPayment(orderId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    let paidOrder: Order | null = null;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Idempotência: só marca como pago se ainda estiver pendente
      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.PAID })
        .where('id = :orderId AND status = :status', {
          orderId,
          status: OrderStatus.PENDING,
        })
        .execute();

      if ((updateResult.affected ?? 0) === 0) {
        this.logger.log(
          `[Idempotência] Pedido ${orderId} já processado ou não está pendente.`,
        );
        await queryRunner.rollbackTransaction();
        return;
      }

      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: { user: true, items: { product: true } },
      });

      if (!order) {
        throw new Error(`Pedido ${orderId} não encontrado após atualização`);
      }

      paidOrder = order;

      // Baixa de estoque condicional
      for (const item of order.items) {
        const stockResult = await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'stock - :quantity' })
          .where('id = :productId AND stock >= :quantity', {
            productId: item.product.id,
            quantity: item.quantity,
          })
          .execute();

        if ((stockResult.affected ?? 0) === 0) {
          this.logger.error(
            `[ALERTA DE ESTOQUE] Pedido ${orderId} pago, mas o produto ${item.product.id} não tinha estoque suficiente`,
          );
        }
      }

      // Esvaziar o carrinho do dono do pedido
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: order.user.id } },
      });

      if (cart) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(CartItem)
          .where('cart_id = :cartId', { cartId: cart.id })
          .execute();
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Pagamento do pedido ${orderId} confirmado com sucesso.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erro ao processar pagamento do pedido ${orderId}: ${message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }

    if (paidOrder) {
      await this.sendConfirmationEmail(paidOrder);
    }
  }

  private async sendConfirmationEmail(order: Order): Promise<void> {
    const email = order.user.email;

    if (!email) {
      this.logger.warn(
        `Pedido ${order.id} pago, mas o usuário não tem e-mail. Envio pulado.`,
      );
      return;
    }

    try {
      await this.mailService.sendOrderConfirmation({
        to: email,
        customerName: order.user.firstName ?? 'cliente',
        orderId: order.id,
        items: order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPriceInCents: item.unitPriceInCents,
          subtotalInCents: item.unitPriceInCents * item.quantity,
        })),
        totalInCents: order.totalInCents,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Pedido ${order.id} pago, mas o e-mail de confirmação falhou: ${message}`,
      );
    }
  }

  async cancelPendingOrder(orderId: number): Promise<void> {
    const result = await this.orderRepository.update(
      { id: orderId, status: OrderStatus.PENDING },
      { status: OrderStatus.CANCELED },
    );

    if ((result.affected ?? 0) === 0) {
      this.logger.log(
        `[Idempotência] Pedido ${orderId} já processado ou não está pendente.`,
      );
      return;
    }

    this.logger.log(`Pedido ${orderId} cancelado por expiração da sessão.`);
  }
}
