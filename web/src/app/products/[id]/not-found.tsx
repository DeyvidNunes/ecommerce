import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-center">
      <h1 className="text-xl font-bold">Produto não encontrado</h1>
      <p className="mt-2 text-gray-600">
        Ele pode ter sido removido ou o endereço está errado.
      </p>
      <Link href="/" className="mt-4 inline-block underline">
        Voltar ao catálogo
      </Link>
    </main>
  )
}