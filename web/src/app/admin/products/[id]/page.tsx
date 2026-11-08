'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProductForm } from '@/components/product-form'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import type { Product } from '@/lib/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const api = useApi()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setError(new ApiError(404, 'Produto não encontrado'))
      setLoading(false)
      return
    }

    let active = true
    api<Product>(`/products/admin/${id}`)
      .then((data) => active && setProduct(data))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e : new ApiError(0, 'Erro inesperado')),
      )
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [api, id])

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="text-sm text-slate-500 transition-all duration-300 hover:text-indigo-600"
      >
        ← Voltar à lista
      </Link>
      <h2 className="mb-6 mt-4 text-2xl font-bold">Editar produto</h2>

      {loading ? (
        <div className="skeleton h-96" />
      ) : error ? (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold">
            {error.status === 404
              ? 'Produto não encontrado'
              : 'Não foi possível carregar'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{error.message}</p>
          <Link href="/admin" className="btn btn-primary mt-6">
            Voltar à lista
          </Link>
        </div>
      ) : (
        product && <ProductForm key={product.id} product={product} />
      )}
    </div>
  )
}