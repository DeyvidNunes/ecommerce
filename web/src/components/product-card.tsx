import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="card group flex flex-col overflow-hidden hover:scale-[1.02] hover:shadow-md"
    >
      <div className="relative grid h-44 place-items-center bg-gradient-to-br from-indigo-500 to-violet-500">
        <span
          aria-hidden
          className="text-5xl font-bold text-white/90 transition-all duration-300 group-hover:scale-110"
        >
          {product.name.charAt(0).toUpperCase()}
        </span>
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 backdrop-blur">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-6">
        {product.category && (
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {product.category}
          </span>
        )}
        <h2 className="text-lg font-semibold leading-snug">{product.name}</h2>
        {product.description && (
          <p className="line-clamp-2 text-sm text-slate-500">
            {product.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-xl font-bold tracking-tight">
          {formatPrice(product.priceInCents)}
        </p>
      </div>
    </Link>
  )
}