import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { AdminLink } from '@/components/admin-link'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'
import { BRAND } from '@/lib/brand'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
}

const navLink =
  'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-slate-900'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className={`${inter.variable} font-sans antialiased`}>
          <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <Logo />
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link href="/products" className={navLink}>
                  Produtos
                </Link>
                <Link href="/cart" className={navLink}>
                  Carrinho
                </Link>
                <Link href="/orders" className={navLink}>
                  Pedidos
                </Link>
                <Suspense fallback={null}>
                  <Show when="signed-out">
                    <SignInButton>
                      <button className="btn btn-secondary !px-4 !py-2">Entrar</button>
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
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}