'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'

export default function TestePage() {
  const api = useApi()
  const [resultado, setResultado] = useState<string>('')
  const [carregando, setCarregando] = useState(false)

  async function chamarMe() {
    setCarregando(true)
    setResultado('')
    try {
      const dados = await api('/auth/me')
      setResultado(JSON.stringify(dados, null, 2))
    } catch (error) {
      if (error instanceof ApiError) {
        setResultado(`Erro ${error.status}: ${error.message}`)
      } else {
        setResultado('Erro inesperado')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Teste da API</h1>
      <button
        onClick={chamarMe}
        disabled={carregando}
        className="mt-4 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {carregando ? 'Chamando… (a API pode estar acordando)' : 'Chamar GET /auth/me'}
      </button>
      <pre className="mt-4 whitespace-pre-wrap rounded border p-4 text-sm">
        {resultado || 'Nenhuma chamada ainda'}
      </pre>
    </main>
  )
}