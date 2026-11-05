import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ApiError } from '@/lib/api-error'
import { formatPrice } from '@/lib/format'
import { getProduct } from '@/lib/products'

type Params = Promise<{ id: string }>

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/" className="text-sm text-gray-600 underline">
        ← Voltar ao catálogo
      </Link>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  )
}

async function ProductDetail({ params }: { params: Params }) {
  const { id } = await params

  if (!/^\d+$/.test(id)) notFound()

  let product
  try {
    product = await getProduct(id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  if (!product.active) notFound()

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-2">
      <div className="flex h-72 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        Sem imagem
      </div>

      <div className="flex flex-col gap-3">
        {product.category && (
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {product.category}
          </span>
        )}
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {product.description && (
          <p className="text-gray-700">{product.description}</p>
        )}
        <p className="text-2xl font-bold">{formatPrice(product.priceInCents)}</p>
        <p className="text-sm text-gray-600">
          {product.stock > 0
            ? `${product.stock} em estoque`
            : 'Produto esgotado'}
        </p>
        <AddToCartButton productId={product.id} disabled={product.stock === 0} />
      </div>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="mt-6 grid gap-8 md:grid-cols-2">
      <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}