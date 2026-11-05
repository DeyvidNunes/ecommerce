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

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Catálogo</h1>
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
    return `/?${query.toString()}`
  }

  return (
    <>
      <form className="mb-6 flex flex-wrap gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar produto"
          className="min-w-48 flex-1 rounded border px-3 py-2"
        />
        <input
          name="category"
          defaultValue={category}
          placeholder="Categoria"
          className="w-48 rounded border px-3 py-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Filtrar</button>
        {(search || category) && (
          <Link href="/" className="px-3 py-2 text-sm text-gray-600 underline">
            Limpar
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <p className="text-gray-600">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4">
          {meta.page > 1 ? (
            <Link href={pageHref(meta.page - 1)} className="underline">
              Anterior
            </Link>
          ) : (
            <span className="text-gray-400">Anterior</span>
          )}
          <span className="text-sm text-gray-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          {meta.page < meta.totalPages ? (
            <Link href={pageHref(meta.page + 1)} className="underline">
              Próxima
            </Link>
          ) : (
            <span className="text-gray-400">Próxima</span>
          )}
        </nav>
      )}
    </>
  )
}

function CatalogSkeleton() {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Carregando produtos… (se a API estava dormindo, a primeira vez pode demorar)
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}