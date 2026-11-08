'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import { formatDate, formatPrice } from '@/lib/format'
import type { OrderDetail } from '@/lib/types'

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 20 // cerca de 60 s

export function OrderView() {
  const { id } = useParams<{ id: string }>()
  const fromStripe = Boolean(useSearchParams().get('session_id'))
  const api = useApi()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrder = useCallback(
    () => api<OrderDetail>(`/orders/${id}`),
    [api, id],
  )

  // Carga inicial
  useEffect(() => {
    let active = true
    fetchOrder()
      .then((data) => active && setOrder(data))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e : new ApiError(0, 'Erro inesperado')),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [fetchOrder])

  // Acompanha o pagamento só quando o usuário acabou de voltar do Stripe
  useEffect(() => {
    if (!fromStripe || order?.status !== 'pending' || attempts >= MAX_ATTEMPTS) {
      return
    }
    const timer = setTimeout(() => {
      fetchOrder()
        .then(setOrder)
        .catch(() => {}) // falha de rede durante o acompanhamento é ignorada
        .finally(() => setAttempts((n) => n + 1))
    }, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [fromStripe, order, attempts, fetchOrder])

  async function refresh() {
    setRefreshing(true)
    try {
      setOrder(await fetchOrder())
      setAttempts(0)
    } catch {
      // mantém o que já está na tela
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <p className="text-sm text-slate-500">
          Carregando pedido… (se a API estava dormindo, a primeira vez pode
          demorar)
        </p>
        <div className="skeleton h-28" />
        <div className="skeleton h-64" />
      </div>
    )
  }

  if (error) {
    const notFound = error.status === 404
    return (
      <div className="card mx-auto mt-8 max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">
          {notFound ? 'Pedido não encontrado' : 'Não foi possível carregar'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {notFound
            ? 'Ele não existe ou não pertence à sua conta.'
            : error.message}
        </p>
        <Link href="/orders" className="btn btn-primary mt-6">
          Ver meus pedidos
        </Link>
      </div>
    )
  }

  if (!order) return null

  const processing = fromStripe && order.status === 'pending'
  const gaveUp = processing && attempts >= MAX_ATTEMPTS

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Pedido #{order.id}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === 'paid' && (
        <div
          role="status"
          className="glass flex items-start gap-4 rounded-3xl p-6"
        >
          <div
            aria-hidden
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl text-white"
          >
            ✓
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pagamento confirmado</h2>
            <p className="mt-1 text-sm text-slate-600">
              {fromStripe
                ? 'Obrigado pela compra! Enviamos a confirmação para o seu e-mail.'
                : 'Este pedido já foi pago.'}
            </p>
          </div>
        </div>
      )}

      {processing && !gaveUp && (
        <div
          role="status"
          className="glass flex items-start gap-4 rounded-3xl p-6"
        >
          <div
            aria-hidden
            className="mt-1 h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500"
          />
          <div>
            <h2 className="text-lg font-semibold">Confirmando seu pagamento…</h2>
            <p className="mt-1 text-sm text-slate-600">
              Isso costuma levar alguns segundos. Você não precisa recarregar a
              página.
            </p>
          </div>
        </div>
      )}

      {gaveUp && (
        <div role="status" className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold">
            Ainda estamos confirmando o pagamento
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Está demorando mais que o normal. Se você concluiu o pagamento, ele
            aparece aqui em instantes; você também pode acompanhar em Meus
            pedidos.
          </p>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn btn-primary mt-4"
          >
            {refreshing ? 'Atualizando…' : 'Atualizar status'}
          </button>
        </div>
      )}

      {order.status === 'pending' && !fromStripe && (
        <div role="status" className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Aguardando pagamento</h2>
          <p className="mt-1 text-sm text-slate-600">
            Este pedido ainda não foi pago. Se o pagamento não for concluído, o
            pedido é cancelado automaticamente.
          </p>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn btn-secondary mt-4"
          >
            {refreshing ? 'Atualizando…' : 'Atualizar status'}
          </button>
        </div>
      )}

      {(order.status === 'canceled' || order.status === 'cancelled') && (
        <div role="status" className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Pedido cancelado</h2>
          <p className="mt-1 text-sm text-slate-600">
            O pagamento não foi concluído. Você pode montar um novo carrinho
            quando quiser.
          </p>
        </div>
      )}

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Itens</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {order.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} × {formatPrice(item.unitPriceInCents)}
                </p>
              </div>
              <p className="shrink-0 font-semibold">
                {formatPrice(item.subtotal)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between border-t border-slate-200/70 pt-6">
          <span className="font-medium">Total</span>
          <span className="text-2xl font-bold tracking-tight">
            {formatPrice(order.totalInCents)}
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/orders" className="btn btn-secondary">
          Meus pedidos
        </Link>
        <Link href="/products" className="btn btn-primary">
          Continuar comprando
        </Link>
      </div>
    </div>
  )
}