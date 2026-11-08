'use client'

import { SignInButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import type { Cart } from '@/lib/types'

export function AddToCartButton({
  productId,
  stock,
}: {
  productId: number
  stock: number
}) {
  const { isLoaded, isSignedIn } = useAuth()
  const api = useApi()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const maxQuantity = Math.min(stock, 99)

  if (stock === 0) {
    return (
      <button disabled className="btn btn-primary mt-2 w-full sm:w-auto">
        Esgotado
      </button>
    )
  }

  async function handleAdd() {
    setLoading(true)
    setMessage(null)
    try {
      await api<Cart>('/cart/items', {
        method: 'POST',
        body: { productId, quantity },
      })
      setMessage({ ok: true, text: 'Produto adicionado ao carrinho.' })
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof ApiError ? error.message : 'Erro inesperado',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white"
          role="group"
          aria-label="Quantidade"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Diminuir quantidade"
            className="grid h-12 w-12 place-items-center rounded-l-xl text-lg text-slate-600 transition-all duration-300 hover:bg-slate-100 disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-12 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Aumentar quantidade"
            className="grid h-12 w-12 place-items-center rounded-r-xl text-lg text-slate-600 transition-all duration-300 hover:bg-slate-100 disabled:opacity-40"
          >
            +
          </button>
        </div>

        {isLoaded && !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="btn btn-primary flex-1 sm:flex-none">
              Entre para comprar
            </button>
          </SignInButton>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading || !isLoaded}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            {loading ? 'Adicionando…' : 'Adicionar ao carrinho'}
          </button>
        )}
      </div>

      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}{' '}
          {message.ok && (
            <Link href="/cart" className="font-semibold underline">
              Ver carrinho
            </Link>
          )}
        </p>
      )}
    </div>
  )
}