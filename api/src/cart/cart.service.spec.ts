import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from '../products/products.service';
import {
  makeCart,
  makeCartItem,
  makeProduct,
  makeUser,
} from '../testing/factories';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

describe('CartService', () => {
  let service: CartService;

  // Versões falsas das dependências: nenhum banco é usado.
  const cartRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const cartItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const productsService = { findOne: jest.fn() };

  const user = makeUser();

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: cartRepository },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    service = moduleRef.get(CartService);

    // O create do repositório devolve o próprio objeto recebido.
    cartItemRepository.create.mockImplementation((data: object) => data);
  });

  describe('getCart', () => {
    it('cria um carrinho vazio quando o usuário ainda não tem um', async () => {
      const newCart = makeCart([], { id: 9 });
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.create.mockReturnValue(newCart);
      cartRepository.save.mockResolvedValue(newCart);

      const result = await service.getCart(user);

      expect(cartRepository.create).toHaveBeenCalledWith({ user, items: [] });
      expect(result).toEqual({
        id: 9,
        items: [],
        totalInCents: 0,
        totalItems: 0,
      });
    });

    it('calcula subtotais, total e quantidade total em centavos', async () => {
      const cart = makeCart([
        makeCartItem({
          id: 1,
          quantity: 2,
          product: makeProduct({ id: 1, priceInCents: 5000 }),
        }),
        makeCartItem({
          id: 2,
          quantity: 1,
          product: makeProduct({ id: 2, priceInCents: 1250 }),
        }),
      ]);
      cartRepository.findOne.mockResolvedValue(cart);

      const result = await service.getCart(user);

      expect(result.items.map((item) => item.subtotal)).toEqual([10000, 1250]);
      expect(result.totalInCents).toBe(11250);
      expect(result.totalItems).toBe(3);
    });
  });

  describe('addItem', () => {
    it('lança NotFoundException quando o produto está inativo', async () => {
      productsService.findOne.mockResolvedValue(
        makeProduct({ id: 7, active: false }),
      );

      await expect(
        service.addItem(user, { productId: 7, quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('cria um item novo quando o produto ainda não está no carrinho', async () => {
      const product = makeProduct({ id: 7, stock: 10 });
      const cart = makeCart([]);
      productsService.findOne.mockResolvedValue(product);
      cartRepository.findOne.mockResolvedValue(cart);

      await service.addItem(user, { productId: 7, quantity: 2 });

      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cart,
        product,
        quantity: 2,
      });
      expect(cartItemRepository.save).toHaveBeenCalledTimes(1);
    });

    it('soma a quantidade quando o produto já está no carrinho', async () => {
      const product = makeProduct({ id: 7, stock: 10 });
      const item = makeCartItem({ id: 3, product, quantity: 2 });
      productsService.findOne.mockResolvedValue(product);
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      const result = await service.addItem(user, { productId: 7, quantity: 1 });

      expect(item.quantity).toBe(3);
      expect(cartItemRepository.save).toHaveBeenCalledWith(item);
      expect(cartItemRepository.create).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('lança BadRequestException e não grava quando a soma passa do estoque', async () => {
      const product = makeProduct({ id: 7, stock: 10 });
      const item = makeCartItem({ id: 3, product, quantity: 3 });
      productsService.findOne.mockResolvedValue(product);
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await expect(
        service.addItem(user, { productId: 7, quantity: 8 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(item.quantity).toBe(3);
      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('aceita a quantidade exatamente igual ao estoque', async () => {
      const product = makeProduct({ id: 7, stock: 10 });
      const item = makeCartItem({ id: 3, product, quantity: 3 });
      productsService.findOne.mockResolvedValue(product);
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await service.addItem(user, { productId: 7, quantity: 7 });

      expect(item.quantity).toBe(10);
      expect(cartItemRepository.save).toHaveBeenCalledWith(item);
    });
  });

  describe('updateItem', () => {
    it('lança NotFoundException quando o item não está no carrinho do usuário', async () => {
      const item = makeCartItem({ id: 5 });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      // 99 é o id de um item de outro carrinho: não aparece na lista deste.
      await expect(
        service.updateItem(user, 99, { quantity: 2 }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('substitui a quantidade, sem somar com a anterior', async () => {
      const item = makeCartItem({
        id: 5,
        quantity: 3,
        product: makeProduct({ stock: 10 }),
      });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await service.updateItem(user, 5, { quantity: 5 });

      expect(item.quantity).toBe(5);
      expect(cartItemRepository.save).toHaveBeenCalledWith(item);
    });

    it('lança BadRequestException quando a quantidade passa do estoque', async () => {
      const item = makeCartItem({
        id: 5,
        quantity: 2,
        product: makeProduct({ stock: 10 }),
      });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await expect(
        service.updateItem(user, 5, { quantity: 11 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(item.quantity).toBe(2);
      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('bloqueia o aumento da quantidade de um produto inativo', async () => {
      const item = makeCartItem({
        id: 5,
        quantity: 2,
        product: makeProduct({ active: false, stock: 10 }),
      });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await expect(
        service.updateItem(user, 5, { quantity: 3 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('permite diminuir ou manter a quantidade de um produto inativo', async () => {
      const item = makeCartItem({
        id: 5,
        quantity: 2,
        product: makeProduct({ active: false, stock: 10 }),
      });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await service.updateItem(user, 5, { quantity: 1 });
      expect(item.quantity).toBe(1);

      await service.updateItem(user, 5, { quantity: 1 });
      expect(item.quantity).toBe(1);
      expect(cartItemRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeItem', () => {
    it('lança NotFoundException para um item que não é do carrinho do usuário', async () => {
      cartRepository.findOne.mockResolvedValue(
        makeCart([makeCartItem({ id: 5 })]),
      );

      await expect(service.removeItem(user, 99)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(cartItemRepository.remove).not.toHaveBeenCalled();
    });

    it('remove o item, mesmo que o produto esteja inativo', async () => {
      const item = makeCartItem({
        id: 5,
        product: makeProduct({ active: false }),
      });
      cartRepository.findOne.mockResolvedValue(makeCart([item]));

      await service.removeItem(user, 5);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(item);
    });
  });

  describe('clear', () => {
    it('não chama o banco quando o carrinho já está vazio', async () => {
      cartRepository.findOne.mockResolvedValue(makeCart([]));

      const result = await service.clear(user);

      expect(cartItemRepository.remove).not.toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });

    it('remove todos os itens do carrinho', async () => {
      const items = [makeCartItem({ id: 1 }), makeCartItem({ id: 2 })];
      cartRepository.findOne.mockResolvedValue(makeCart(items));

      await service.clear(user);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(items);
    });
  });
});
