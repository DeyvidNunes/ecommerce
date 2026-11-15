'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { CART_CHANGED_EVENT } from '@/lib/cart-events'
import type { Cart } from '@/lib/types'

export function CartLink({ className }: { className: string }) {
  const { isLoaded, isSignedIn } = useAuth()
  const api = useApi()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    let active = true
    const load = () =>
      api<Cart>('/cart')
        .then((cart) => active && setCount(cart.totalItems))
        .catch(() => {}) // o contador é só conveniência: falhas ficam em silêncio

    load()
    window.addEventListener(CART_CHANGED_EVENT, load)
    return () => {
      active = false
      window.removeEventListener(CART_CHANGED_EVENT, load)
    }
  }, [isLoaded, isSignedIn, api])

  const visible = isSignedIn ? count : 0

  return (
    <Link href="/cart" className={`inline-flex items-center gap-2 ${className}`}>
      Carrinho
      {visible > 0 && (
        <>
          <span
            aria-hidden
            className="grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold leading-none text-white"
          >
            {visible > 99 ? '99+' : visible}
          </span>
          <span className="sr-only">({visible} itens)</span>
        </>
      )}
    </Link>
  )
}