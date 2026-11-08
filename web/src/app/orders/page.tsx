'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import { formatDate, formatPrice } from '@/lib/format'
import type { OrderSummary, Paginated } from '@/lib/types'

function summarize(items: OrderSummary['items']) {
  const names = items.slice(0, 2).map((i) => `${i.quantity}× ${i.productName}`)
  const rest = items.length - names.length
  return rest > 0 ? `${names.join(', ')} e mais ${rest}` : names.join(', ')
}

export default function OrdersPage() {
  const api = useApi()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<OrderSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (target: number) => {
      try {
        setResult(await api<Paginated<OrderSummary>>(`/orders?page=${target}`))
        setError(null)
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    },
    [api],
  )

  useEffect(() => {
    load(page)
  }, [load, page])

  function goTo(target: number) {
    setLoading(true)
    setPage(target)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Meus pedidos</h1>
      <p className="mt-2 text-slate-500">Acompanhe suas compras e pagamentos.</p>

      <div className="mt-8">
        {loading ? (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Carregando seus pedidos… (se a API estava dormindo, a primeira vez
              pode demorar)
            </p>
            <div className="flex flex-col gap-4">
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
            </div>
          </div>
        ) : error ? (
          <div className="card mx-auto max-w-md p-8 text-center">
            <h2 className="text-lg font-semibold">Não foi possível carregar</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => goTo(page)}
              className="btn btn-primary mt-6"
            >
              Tentar novamente
            </button>
          </div>
        ) : !result || result.data.length === 0 ? (
          <div className="card mx-auto max-w-md p-10 text-center">
            <h2 className="text-xl font-semibold">Nenhum pedido ainda</h2>
            <p className="mt-2 text-sm text-slate-500">
              Quando você finalizar uma compra, ela aparece aqui.
            </p>
            <Link href="/products" className="btn btn-primary mt-6">
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {result.data.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="card flex flex-col gap-4 p-4 hover:scale-[1.02] hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">
                          Pedido #{order.id}
                        </h2>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {summarize(order.items)}
                      </p>
                    </div>
                    <p className="text-xl font-bold tracking-tight">
                      {formatPrice(order.totalInCents)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

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
      </div>
    </main>
  )
}