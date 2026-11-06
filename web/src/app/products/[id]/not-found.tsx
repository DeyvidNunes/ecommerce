import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="card mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">Produto não encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ele pode ter sido removido ou o endereço está errado.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Voltar ao catálogo
        </Link>
      </div>
    </main>
  )
}