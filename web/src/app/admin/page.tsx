'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import { formatPrice } from '@/lib/format'
import type { Paginated, Product } from '@/lib/types'

const PAGE_SIZE = 10

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Erro inesperado'
}

export default function AdminProductsPage() {
  const api = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    })
    if (search) query.set('search', search)

    try {
      setResult(await api<Paginated<Product>>(`/products/admin?${query}`))
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [api, page, search])

  useEffect(() => {
    load()
  }, [load])

  function goTo(target: number) {
    setLoading(true)
    setPage(target)
  }

  function applySearch(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function toggleActive(product: Product) {
    if (
      product.active &&
      !window.confirm(`Desativar "${product.name}"? Ele some do catálogo.`)
    ) {
      return
    }

    setBusyId(product.id)
    setActionError(null)
    try {
      if (product.active) {
        await api(`/products/${product.id}`, { method: 'DELETE' })
      } else {
        await api(`/products/${product.id}`, {
          method: 'PATCH',
          body: { active: true },
        })
      }
      await load()
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={applySearch} className="glass flex flex-1 gap-2 rounded-2xl p-2 sm:max-w-md">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            className="input flex-1"
          />
          <button className="btn btn-secondary">Buscar</button>
        </form>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Novo produto
        </Link>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : error ? (
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold">Não foi possível carregar</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              load()
            }}
            className="btn btn-primary mt-6"
          >
            Tentar novamente
          </button>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <h2 className="text-xl font-semibold">Nenhum produto encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre o primeiro produto ou ajuste a busca.
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Preço</th>
                  <th className="px-6 py-4 font-semibold">Estoque</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((product) => (
                  <tr
                    key={product.id}
                    className={`transition-all duration-300 hover:bg-slate-50 ${
                      busyId === product.id ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        {product.category ?? 'Sem categoria'}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(product.priceInCents)}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        product.stock === 0 ? 'font-semibold text-rose-600' : ''
                      }`}
                    >
                      {product.stock}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                          product.active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="btn btn-secondary !px-4 !py-2"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => toggleActive(product)}
                          disabled={busyId !== null}
                          className="btn btn-ghost"
                        >
                          {product.active ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.meta.totalPages > 1 && (
            <nav
              aria-label="Paginação"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <button
                onClick={() => goTo(result.meta.page - 1)}
                disabled={result.meta.page <= 1}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-500">
                Página {result.meta.page} de {result.meta.totalPages}
              </span>
              <button
                onClick={() => goTo(result.meta.page + 1)}
                disabled={result.meta.page >= result.meta.totalPages}
                className="btn btn-secondary"
              >
                Próxima →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}