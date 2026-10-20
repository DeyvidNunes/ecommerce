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

@Injectable()
export class OrdersService {
  constructor(
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}
  async checkout(user: User) {
    const cart = await this.cartService.getOrCreateCart(user);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      throw new BadRequestException(`Carrinho vazio`);
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

    return {
      id: order.id,
      status: order.status,
      totalInCents: order.totalInCents,
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
}
