import {
  BadGatewayException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { MailService } from '../mail/mail.service';
import { PaymentsService } from '../payments/payments.service';
import {
  makeCart,
  makeCartItem,
  makeProduct,
  makeUser,
  messagesOf,
} from '../testing/factories';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService.checkout', () => {
  let service: OrdersService;

  const cartService = { getOrCreateCart: jest.fn() };
  const paymentsService = { createCheckoutSession: jest.fn() };
  const mailService = { sendOrderConfirmation: jest.fn() };
  const orderRepository = { update: jest.fn() };

  // Gerenciador "de dentro" da transação e gerenciador comum do DataSource.
  const txManager = { create: jest.fn(), save: jest.fn() };
  const dataSource = {
    manager: { create: jest.fn() },
    transaction: jest.fn(),
  };

  const user = makeUser();

  // Carrinho com dois produtos: 2 x R$ 50,00 + 1 x R$ 12,50 = R$ 112,50
  function cartWithTwoProducts() {
    return makeCart([
      makeCartItem({
        id: 1,
        quantity: 2,
        product: makeProduct({ id: 1, name: 'Camiseta', priceInCents: 5000 }),
      }),
      makeCartItem({
        id: 2,
        quantity: 1,
        product: makeProduct({ id: 2, name: 'Boné', priceInCents: 1250 }),
      }),
    ]);
  }

  beforeEach(async () => {
    jest.resetAllMocks();

    // Silencia os logs durante os testes.
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: CartService, useValue: cartService },
        { provide: DataSource, useValue: dataSource },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: MailService, useValue: mailService },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);

    dataSource.manager.create.mockImplementation(
      (_entity: unknown, data: object) => ({ ...data }),
    );
    txManager.create.mockImplementation((_entity: unknown, data: object) => ({
      ...data,
    }));
    txManager.save.mockImplementation(async (order: object) => ({
      ...order,
      id: 10,
    }));
    dataSource.transaction.mockImplementation(
      async (callback: (manager: unknown) => unknown) => callback(txManager),
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('lança BadRequestException quando o carrinho está vazio', async () => {
    cartService.getOrCreateCart.mockResolvedValue(makeCart([]));

    await expect(service.checkout(user)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(paymentsService.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('acumula os erros de produto inativo e de estoque, sem criar pedido', async () => {
    cartService.getOrCreateCart.mockResolvedValue(
      makeCart([
        makeCartItem({
          id: 1,
          quantity: 1,
          product: makeProduct({ id: 1, name: 'Produto A', active: false }),
        }),
        makeCartItem({
          id: 2,
          quantity: 3,
          product: makeProduct({ id: 2, name: 'Produto B', stock: 1 }),
        }),
      ]),
    );

    const error = await service.checkout(user).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(messagesOf(error)).toEqual([
      expect.stringContaining('"Produto A"'),
      expect.stringContaining('"Produto B"'),
    ]);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(paymentsService.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('copia nome e preço dos produtos e calcula o total no backend', async () => {
    cartService.getOrCreateCart.mockResolvedValue(cartWithTwoProducts());
    paymentsService.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.com/pay/cs_test_1',
    });

    await service.checkout(user);

    expect(txManager.create).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({
        user,
        status: OrderStatus.PENDING,
        totalInCents: 11250,
        items: [
          expect.objectContaining({
            productName: 'Camiseta',
            unitPriceInCents: 5000,
            quantity: 2,
          }),
          expect.objectContaining({
            productName: 'Boné',
            unitPriceInCents: 1250,
            quantity: 1,
          }),
        ],
      }),
    );
  });

  it('cria a sessão do Stripe, salva o id dela no pedido e devolve a URL', async () => {
    cartService.getOrCreateCart.mockResolvedValue(cartWithTwoProducts());
    paymentsService.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.com/pay/cs_test_1',
    });

    const result = await service.checkout(user);

    expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
    );
    expect(orderRepository.update).toHaveBeenCalledWith(10, {
      stripeSessionId: 'cs_test_1',
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 10,
        status: OrderStatus.PENDING,
        totalInCents: 11250,
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_1',
      }),
    );
  });

  it('cancela o pedido e responde 502 quando o Stripe falha', async () => {
    cartService.getOrCreateCart.mockResolvedValue(cartWithTwoProducts());
    paymentsService.createCheckoutSession.mockRejectedValue(
      new Error('stripe fora do ar'),
    );

    await expect(service.checkout(user)).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    expect(orderRepository.update).toHaveBeenCalledTimes(1);
    expect(orderRepository.update).toHaveBeenCalledWith(10, {
      status: OrderStatus.CANCELED,
    });
  });
});
