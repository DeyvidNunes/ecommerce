import Link from 'next/link'
import { Suspense } from 'react'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/products'

const PAGE_SIZE = 12

type SearchParams = Promise<{
  search?: string
  category?: string
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
  const { search = '', category = '', page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { data: products, meta } = await getProducts({
    page,
    limit: PAGE_SIZE,
    search,
    category,
  })

  function pageHref(target: number) {
    const query = new URLSearchParams()
    if (search) query.set('search', search)
    if (category) query.set('category', category)
    query.set('page', String(target))
    return `/products?${query.toString()}`
  }

  return (
    <>
      <form className="glass mb-8 flex flex-col gap-2 rounded-2xl p-2 sm:flex-row">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar produto"
          aria-label="Buscar produto"
          className="input flex-1"
        />
        <input
          name="category"
          defaultValue={category}
          placeholder="Categoria"
          aria-label="Categoria"
          className="input sm:w-56"
        />
        <button className="btn btn-primary">Filtrar</button>
        {(search || category) && (
          <Link href="/products" className="btn btn-secondary">
            Limpar
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <h2 className="text-xl font-semibold">Nenhum produto encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tente outro termo de busca ou limpe os filtros.
          </p>
          <Link href="/products" className="btn btn-primary mt-6">
            Ver todos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
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