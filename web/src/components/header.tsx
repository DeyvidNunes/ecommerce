import Link from 'next/link'
import { Suspense } from 'react'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { AdminLink } from '@/components/admin-link'
import { CartLink } from '@/components/cart-link'
import { Logo } from '@/components/logo'

const navLink =
  'rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-900/5 hover:text-slate-900 sm:px-3'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <Link href="/products" className={navLink}>
            Produtos
          </Link>
          <CartLink className={navLink} />
          <Link href="/orders" className={navLink}>
            Pedidos
          </Link>
          <Suspense fallback={null}>
            <Show when="signed-out">
              <SignInButton>
                <button className="btn btn-secondary hidden !px-4 !py-2 sm:inline-flex">
                  Entrar
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="btn btn-primary !px-4 !py-2">Cadastrar</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <AdminLink />
              <UserButton />
            </Show>
          </Suspense>
        </nav>
      </div>
    </header>
  )
}