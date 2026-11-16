'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'

const LINKS = [
  { href: '/products', label: 'Produtos' },
  { href: '/orders', label: 'Pedidos' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition-all duration-300 hover:bg-slate-900/5 hover:text-slate-900"
      >
        <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-slate-200/60 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-md"
        >
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition-all duration-300 hover:bg-slate-900/5"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}