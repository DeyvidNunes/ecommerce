import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/products'

export const metadata: Metadata = { title: 'Produtos' }

const PAGE_SIZE = 12

type SearchParams = Promise<{
  search?: string
  page?: string
}>

export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-8">
        <h1 className="text-3xl font-bold sm:text-5xl">Produtos</h1>
        <p className="mt-2 max-w-xl text-slate-500">
          Explore o catálogo e monte o seu carrinho.
        </p>
      </section>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Catalog({ searchParams }: { searchParams: SearchParams }) {
  const { search = '', page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { data: products, meta } = await getProducts({
    page,
    limit: PAGE_SIZE,
    search,
  })

  function pageHref(target: number) {
    const query = new URLSearchParams()
    if (search) query.set('search', search)
    query.set('page', String(target))
    return `/products?${query.toString()}`
  }

  const countLabel = `${meta.total} ${meta.total === 1 ? 'produto' : 'produtos'}${
    search ? ` para “${search}”` : ''
  }`

  return (
    <>
      <form role="search" className="glass mb-6 flex gap-2 rounded-2xl p-2">
        <div className="relative flex-1">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            className="input !pl-12"
          />
        </div>
        <button className="btn btn-primary">Buscar</button>
        {search && (
          <Link href="/products" className="btn btn-secondary">
            Limpar
          </Link>
        )}
      </form>

      <p className="mb-6 text-sm text-slate-500" aria-live="polite">
        {countLabel}
      </p>

      {products.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <h2 className="text-xl font-semibold">Nenhum produto encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tente outro termo de busca.
          </p>
          <Link href="/products" className="btn btn-primary mt-6">
            Ver todos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 11) * 60}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <nav
          aria-label="Paginação"
          className="mt-12 flex items-center justify-center gap-4"
        >
          {meta.page > 1 ? (
            <Link href={pageHref(meta.page - 1)} className="btn btn-secondary">
              ← Anterior
            </Link>
          ) : (
            <span className="btn btn-secondary pointer-events-none opacity-40">
              ← Anterior
            </span>
          )}
          <span className="text-sm text-slate-500">
            Página {meta.page} de {meta.totalPages}
          </span>
          {meta.page < meta.totalPages ? (
            <Link href={pageHref(meta.page + 1)} className="btn btn-secondary">
              Próxima →
            </Link>
          ) : (
            <span className="btn btn-secondary pointer-events-none opacity-40">
              Próxima →
            </span>
          )}
        </nav>
      )}
    </>
  )
}

function CatalogSkeleton() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Carregando produtos… (se a API estava dormindo, a primeira vez pode demorar)
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    </div>
  )
}