import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { Cart } from '../cart/entities/cart.entity';
import { MailService } from '../mail/mail.service';
import { PaymentsService } from '../payments/payments.service';
import { makeProduct, makeUser } from '../testing/factories';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

// Query builder falso: cada método devolve o próprio builder (encadeamento),
// e o execute devolve quantas linhas o banco "alterou".
function makeQueryBuilder(affected = 1) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ['update', 'set', 'where', 'delete', 'from']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.execute = jest.fn().mockResolvedValue({ affected });
  return qb;
}

// Pedido já carregado do banco, como o service o lê dentro da transação.
function makeOrderFromDb(userOverrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    user: makeUser({ id: 1, ...userOverrides }),
    totalInCents: 11250,
    items: [
      {
        id: 1,
        product: makeProduct({ id: 1, name: 'Camiseta' }),
        productName: 'Camiseta',
        unitPriceInCents: 5000,
        quantity: 2,
      },
      {
        id: 2,
        product: makeProduct({ id: 2, name: 'Boné' }),
        productName: 'Boné',
        unitPriceInCents: 1250,
        quantity: 1,
      },
    ],
  };
}

describe('OrdersService (pagamento)', () => {
  let service: OrdersService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const cartService = { getOrCreateCart: jest.fn() };
  const paymentsService = { createCheckoutSession: jest.fn() };
  const mailService = { sendOrderConfirmation: jest.fn() };
  const orderRepository = { update: jest.fn() };

  const manager = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager,
  };
  const dataSource = { createQueryRunner: jest.fn() };

  // Monta a sequência de chamadas ao banco na mesma ordem em que o service as faz:
  // 1) atualiza o pedido, 2) lê o pedido, 3) baixa o estoque de cada item,
  // 4) lê o carrinho, 5) apaga os itens do carrinho.
  function prepare(options: {
    order?: ReturnType<typeof makeOrderFromDb>;
    orderAffected?: number;
    stockAffected?: number[];
    hasCart?: boolean;
  }) {
    const order = options.order ?? makeOrderFromDb();
    const stockAffected = options.stockAffected ?? [1, 1];
    const hasCart = options.hasCart ?? true;

    const orderQb = makeQueryBuilder(options.orderAffected ?? 1);
    const stockQbs = stockAffected.map((affected) => makeQueryBuilder(affected));
    const cartQb = makeQueryBuilder(1);

    manager.createQueryBuilder.mockReturnValueOnce(orderQb);
    stockQbs.forEach((qb) => manager.createQueryBuilder.mockReturnValueOnce(qb));
    if (hasCart) {
      manager.createQueryBuilder.mockReturnValueOnce(cartQb);
    }

    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Order) return Promise.resolve(order);
      if (entity === Cart) return Promise.resolve(hasCart ? { id: 5 } : null);
      return Promise.resolve(null);
    });

    return { order, orderQb, stockQbs, cartQb };
  }

  beforeEach(async () => {
    jest.resetAllMocks();

    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: CartService, useValue: cartService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: MailService, useValue: mailService },
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);

    dataSource.createQueryRunner.mockReturnValue(queryRunner);
    mailService.sendOrderConfirmation.mockResolvedValue(undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('processOrderPayment', () => {
    it('não faz nada quando o pedido já foi processado (idempotência)', async () => {
      prepare({ orderAffected: 0 });

      await service.processOrderPayment(10);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(manager.findOne).not.toHaveBeenCalled();
      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mailService.sendOrderConfirmation).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Idempotência'),
      );
    });

    it('marca como pago, baixa o estoque, esvazia o carrinho e confirma a transação', async () => {
      const { orderQb, stockQbs, cartQb } = prepare({});

      await service.processOrderPayment(10);

      // Só muda o status se o pedido ainda estiver pendente.
      expect(orderQb.where).toHaveBeenCalledWith(
        'id = :orderId AND status = :status',
        { orderId: 10, status: OrderStatus.PENDING },
      );

      // Baixa condicional: só diminui se houver saldo suficiente.
      expect(stockQbs[0].where).toHaveBeenCalledWith(
        'id = :productId AND stock >= :quantity',
        { productId: 1, quantity: 2 },
      );
      expect(stockQbs[1].where).toHaveBeenCalledWith(
        'id = :productId AND stock >= :quantity',
        { productId: 2, quantity: 1 },
      );

      // Esvazia o carrinho do dono do pedido.
      expect(cartQb.where).toHaveBeenCalledWith('cart_id = :cartId', {
        cartId: 5,
      });

      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('envia o e-mail de confirmação com os dados do pedido, depois do commit', async () => {
      prepare({});

      await service.processOrderPayment(10);

      expect(mailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
      expect(mailService.sendOrderConfirmation).toHaveBeenCalledWith({
        to: 'ana@example.com',
        customerName: 'Ana',
        orderId: 10,
        items: [
          {
            name: 'Camiseta',
            quantity: 2,
            unitPriceInCents: 5000,
            subtotalInCents: 10000,
          },
          {
            name: 'Boné',
            quantity: 1,
            unitPriceInCents: 1250,
            subtotalInCents: 1250,
          },
        ],
        totalInCents: 11250,
      });

      const commitOrder = queryRunner.commitTransaction.mock.invocationCallOrder[0];
      const mailOrder = mailService.sendOrderConfirmation.mock.invocationCallOrder[0];
      expect(commitOrder).toBeLessThan(mailOrder);
    });

    it('mantém o pedido pago e registra alerta quando o estoque não cobre a compra', async () => {
      const { cartQb } = prepare({ stockAffected: [1, 0] });

      await expect(service.processOrderPayment(10)).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERTA DE ESTOQUE'),
      );
      expect(cartQb.execute).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
    });

    it('não tenta esvaziar o carrinho quando o usuário não tem carrinho', async () => {
      prepare({ hasCart: false });

      await service.processOrderPayment(10);

      // 1 do pedido + 2 do estoque, e nenhum para o carrinho.
      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(3);
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('não derruba o pagamento quando o envio do e-mail falha', async () => {
      prepare({});
      mailService.sendOrderConfirmation.mockRejectedValue(
        new Error('resend fora do ar'),
      );

      await expect(service.processOrderPayment(10)).resolves.toBeUndefined();

      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('e-mail'),
      );
    });

    it('pula o e-mail quando o usuário não tem e-mail cadastrado', async () => {
      prepare({ order: makeOrderFromDb({ email: null }) });

      await service.processOrderPayment(10);

      expect(mailService.sendOrderConfirmation).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('não tem e-mail'),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('desfaz tudo e repassa o erro quando o banco falha no meio da transação', async () => {
      const { stockQbs } = prepare({});
      stockQbs[0].execute.mockRejectedValue(new Error('banco fora do ar'));

      await expect(service.processOrderPayment(10)).rejects.toThrow(
        'banco fora do ar',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
      expect(mailService.sendOrderConfirmation).not.toHaveBeenCalled();
    });
  });

  // Este bloco assume que cancelPendingOrder usa orderRepository.update com
  // filtro por id e status. Se o seu usa queryRunner, ajuste conforme o comentário
  // no fim do arquivo.
  describe('cancelPendingOrder', () => {
    it('cancela um pedido que ainda está pendente', async () => {
      orderRepository.update.mockResolvedValue({ affected: 1 });

      await service.cancelPendingOrder(10);

      expect(orderRepository.update).toHaveBeenCalledWith(
        { id: 10, status: OrderStatus.PENDING },
        { status: OrderStatus.CANCELED },
      );
    });

    it('não faz nada quando o pedido já não está pendente (idempotência)', async () => {
      orderRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.cancelPendingOrder(10)).resolves.toBeUndefined();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Idempotência'),
      );
    });

    it('repassa o erro quando o banco falha', async () => {
      orderRepository.update.mockRejectedValue(new Error('banco fora do ar'));

      await expect(service.cancelPendingOrder(10)).rejects.toThrow(
        'banco fora do ar',
      );
    });
  });
});

