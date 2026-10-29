import { HttpException } from '@nestjs/common';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

// Fábricas de dados falsos: cada teste muda só o que importa para ele.

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: 'user_test_1',
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@example.com',
    ...overrides,
  } as unknown as User;
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Camiseta',
    description: null,
    priceInCents: 5000,
    stock: 10,
    category: null,
    imageUrl: null,
    active: true,
    ...overrides,
  } as unknown as Product;
}

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    quantity: 1,
    product: makeProduct(),
    ...overrides,
  } as unknown as CartItem;
}

export function makeCart(
  items: CartItem[] = [],
  overrides: Partial<Cart> = {},
): Cart {
  return { id: 1, items, ...overrides } as unknown as Cart;
}

// Lê as mensagens de uma exceção do Nest (texto único ou lista de textos).
export function messagesOf(error: unknown): string[] {
  if (!(error instanceof HttpException)) {
    return [];
  }

  const response = error.getResponse() as { message?: string | string[] };
  const message = response.message ?? error.message;

  return Array.isArray(message) ? message : [message];
}