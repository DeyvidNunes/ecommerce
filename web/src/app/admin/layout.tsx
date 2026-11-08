'use client'

import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, error, isAdmin } = useCurrentUser()

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-4 text-sm text-slate-500">
          Verificando acesso… (se a API estava dormindo, a primeira vez pode
          demorar)
        </p>
        <div className="skeleton h-64" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="card mx-auto max-w-md p-10 text-center">
          <h1 className="text-xl font-semibold">Não foi possível verificar o acesso</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-6"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="card mx-auto max-w-md p-10 text-center">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-slate-500">
            Esta área é exclusiva para administradores.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Painel</h1>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          Admin
        </span>
      </div>
      {children}
    </div>
  )
}