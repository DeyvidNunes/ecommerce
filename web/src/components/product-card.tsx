import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="flex flex-col overflow-hidden rounded-lg border transition hover:shadow-md"
    >
      <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-400">
        Sem imagem
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.category && (
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {product.category}
          </span>
        )}
        <h2 className="font-semibold">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-gray-600">{product.description}</p>
        )}
        <p className="mt-auto pt-2 text-lg font-bold">
          {formatPrice(product.priceInCents)}
        </p>
        {product.stock === 0 && (
          <p className="text-sm text-red-600">Esgotado</p>
        )}
      </div>
    </Link>
  )
}