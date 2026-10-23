import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import appConfig from '../config/app.config';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';

// @Injectable() avisa ao NestJS que esta classe pode ser injetada em outros serviços ou controllers
@Injectable()
export class PaymentsService {
  // Instância privada do cliente do Stripe
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    // Injeta as configurações da aplicação (onde fica a chave secreta do Stripe e URL do frontend)
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {
    // Inicializa o SDK do Stripe passando a chave secreta vinda das configurações
    this.stripe = new Stripe(this.config.stripe.secretKey!);
  }

  // Método que cria e retorna uma sessão de checkout do Stripe a partir de um pedido (order)
  async createCheckoutSession(order: Order): Promise<Stripe.Checkout.Session> {
    const frontendUrl = this.config.frontendUrl;

    // Chamada à API do Stripe para gerar a URL do checkout
    return this.stripe.checkout.sessions.create({
      // Define que é uma cobrança única (e não uma assinatura)
      mode: 'payment',

      // Associa o ID do seu pedido no Stripe para fácil identificação
      client_reference_id: String(order.id),

      // Dados extras salvos na transação (essencial para ler depois nos Webhooks)
      metadata: { orderId: String(order.id) },

      // Mapeia os itens do seu pedido interno para o formato esperado pelo Stripe
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'brl', // Moeda em Real Brasileiro
          unit_amount: item.unitPriceInCents, // Preço unitário OBRIGATORIAMENTE em centavos
          product_data: { name: item.productName }, // Nome do produto exibido na tela de pagamento
        },
      })),

      // URL para onde o cliente é enviado após pagar com sucesso ({CHECKOUT_SESSION_ID} é substituído automaticamente pelo Stripe)
      success_url: `${frontendUrl}/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,

      // URL para onde o cliente vai se cancelar ou desistir do pagamento
      cancel_url: `${frontendUrl}/cart`,
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!signature) {
      throw new BadRequestException(
        'O cabeçalho stripe-signature está ausente.',
      );
    }
    const webhookSecret = this.config.stripe.webhookSecret!;

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha na verificação da assinatura do webhook: ${errorMessage}`,
      );
      throw new BadRequestException(`Assinatura do webhook inválida`);
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Evento recebido do Stripe: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.sessionCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.sessionCanceled(session);
        break;
      }
      default:
        this.logger.log(`Tipo de evento não tratado: ${event.type}`);
    }

    return { received: true };
  }

  private async sessionCompleted(session: Stripe.Checkout.Session) {
    const orderId = Number(session.metadata?.orderId);

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Sessão ${session.id} recebida com pagamento pendente.`);
      return;
    }

    if (!orderId) {
      this.logger.warn(
        `Evento checkout.session.completed recebido para a sessão ${session.id}, mas 'orderId' esta ausente nos metadados.`,
      );
      return;
    }

    await this.ordersService.processOrderPayment(orderId);
  }

  private async sessionCanceled(session: Stripe.Checkout.Session) {
    const orderId = Number(session.metadata?.orderId);

    if (!orderId) {
      this.logger.warn(
        `Evento checkout.session.expired recebido para a sessão ${session.id}, mas 'orderId' esta ausente nos metadados.`,
      );
      return;
    }

    await this.ordersService.cancelPendingOrder(orderId);
  }
}
