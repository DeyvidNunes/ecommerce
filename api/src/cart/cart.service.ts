import {
  BadRequestException,
  Body,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ProductsService } from '../products/products.service';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly productsService: ProductsService,

    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getCart(user: User) {
    const cart = await this.getOrCreateCart(user);
    return this.formatCart(cart);
  }

  private async getOrCreateCart(user: User) {
    const existing = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: {
        items: {
          product: true,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const cart = this.cartRepository.create({ user, items: [] });

    return this.cartRepository.save(cart);
  }

  private formatCart(cart: Cart) {
    let totalInCents = 0;
    let totalItems = 0;

    const items = (cart.items ?? []).map((item) => {
      const unitPriceInCents = Number(item.product.priceInCents);
      const subtotal = item.quantity * unitPriceInCents;

      totalInCents += subtotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        },
        unitPriceInCents,
        quantity: item.quantity,
        subtotal,
      };
    });

    return {
      id: cart.id,
      items,
      totalInCents,
      totalItems,
    };
  }

  async addItem(user: User, addToCartDto: AddToCartDto) {
    const product = await this.productsService.findOne(addToCartDto.productId);

    if (!product.active) {
      throw new NotFoundException(`Produto ${addToCartDto.productId} inativo`);
    }

    const cart = await this.getOrCreateCart(user);

    // 2. Procurar, em cart.items, um item daquele produto (compare pelo ID do produto)
    const existingItem = cart.items.find(
      (item) => item.product.id === addToCartDto.productId,
    );

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const finalQuantity = currentQuantity + addToCartDto.quantity;

    if (finalQuantity > product.stock) {
      throw new BadRequestException(
        `Quantidade solicitada (${finalQuantity}) excede o estoque disponível (${product.stock} unidades).`,
      );
    }

    if (existingItem) {
      // Achou: atualiza a quantidade do item existente e salva
      existingItem.quantity = finalQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Não achou: cria um CartItem ligando o carrinho, o produto e a quantidade, e salva
      const newItem = this.cartItemRepository.create({
        cart,
        product,
        quantity: finalQuantity,
      });

      await this.cartItemRepository.save(newItem);
    }

    const updatedCart = await this.getOrCreateCart(user);

    return this.formatCart(updatedCart);
  }

  async updateItem(
    user: User,
    itemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(user);

    const existingItem = cart.items.find((item) => item.id === itemId);

    if (!existingItem) {
      throw new NotFoundException(`Item não encontrado no carrinho`);
    }

    if (
      !existingItem.product.active &&
      updateCartItemDto.quantity > existingItem.quantity
    ) {
      throw new BadRequestException(
        'Produto indisponível, não é possível aumentar a quantidade',
      );
    }

    if (updateCartItemDto.quantity > existingItem.product.stock) {
      throw new BadRequestException(
        `Quantidade solicitada (${updateCartItemDto.quantity}) excede o estoque disponível (${existingItem.product.stock} unidades).`,
      );
    }

    existingItem.quantity = updateCartItemDto.quantity;

    await this.cartItemRepository.save(existingItem);

    const updatedCart = await this.getOrCreateCart(user);

    return this.formatCart(updatedCart);
  }

  removeItem(id: number) {
    return `This action removes a #${id} cart`;
  }
}
