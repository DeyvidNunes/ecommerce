export type Product = {
  id: number;
  name: string;
  description: string | null;
  priceInCents: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CartItem = {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
  unitPriceInCents: number;
  quantity: number;
  subtotal: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  totalInCents: number;
  totalItems: number;
};

export type CheckoutResponse = {
  checkoutUrl: string
}

export type OrderSummary = {
  id: number
  status: string
  totalInCents: number
  createdAt: string
  items: {
    id: number
    productName: string
    unitPriceInCents: number
    quantity: number
  }[]
}

export type OrderDetail = {
  id: number
  status: string
  totalInCents: number
  createdAt: string
  items: {
    name: string
    unitPriceInCents: number
    quantity: number
    subtotal: number
  }[]
}
