'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl p-6 text-center">
      <h1 className="text-xl font-bold">Não foi possível carregar</h1>
      <p className="mt-2 text-gray-600">
        A API pode estar indisponível ou acordando. Tente de novo em instantes.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-black px-4 py-2 text-white"
      >
        Tentar novamente
      </button>
    </main>
  )
}