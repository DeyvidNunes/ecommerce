'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="card mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">Não foi possível carregar</h1>
        <p className="mt-2 text-sm text-slate-500">
          A API pode estar indisponível ou acordando. Tente de novo em instantes.
        </p>
        <button onClick={reset} className="btn btn-primary mt-6">
          Tentar novamente
        </button>
      </div>
    </main>
  )
}