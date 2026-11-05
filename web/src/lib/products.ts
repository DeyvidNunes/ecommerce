import { ApiError } from './api-error'
import type { Paginated, Product } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type ListParams = {
  page?: number
  limit?: number
  search?: string
  category?: string
}

// Leitura pública, feita no servidor do Next, com cache de 60 s
async function publicGet<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL não está definida')
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(70_000), // API gratuita pode estar acordando
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : (payload?.message ?? `Erro ${response.status}`)
    throw new ApiError(response.status, message, payload)
  }

  return (await response.json()) as T
}

export function getProducts(params: ListParams = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  return publicGet<Paginated<Product>>(`/products?${query.toString()}`)
}

export function getProduct(id: string | number) {
  return publicGet<Product>(`/products/${id}`)
}