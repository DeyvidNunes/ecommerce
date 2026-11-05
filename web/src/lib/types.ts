export type Product = {
  id: number
  name: string
  description: string | null
  priceInCents: number
  stock: number
  category: string | null
  imageUrl: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type Paginated<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}