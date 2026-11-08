'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import { centsToInput, parsePriceToCents } from '@/lib/format'
import type { Product } from '@/lib/types'

const MAX_STOCK = 1_000_000

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const api = useApi()

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(
    product ? centsToInput(product.priceInCents) : '',
  )
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [category, setCategory] = useState(product?.category ?? '')
  const [active, setActive] = useState(product?.active ?? true)

  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const priceInCents = parsePriceToCents(price)
  const stockNumber = Number(stock)

  const errors = {
    name: !name.trim()
      ? 'Informe o nome'
      : name.length > 150
        ? 'Máximo de 150 caracteres'
        : null,
    price:
      priceInCents === null ? 'Informe um preço válido, por exemplo 49,90' : null,
    stock:
      stock.trim() === '' ||
      !Number.isInteger(stockNumber) ||
      stockNumber < 0 ||
      stockNumber > MAX_STOCK
        ? `Informe um número inteiro de 0 a ${MAX_STOCK}`
        : null,
    category: category.length > 80 ? 'Máximo de 80 caracteres' : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setFormError(null)
    if (hasErrors || priceInCents === null) return

    setSaving(true)
    try {
      if (product) {
        await api(`/products/${product.id}`, {
          method: 'PATCH',
          body: {
            name: name.trim(),
            description: description.trim(),
            priceInCents,
            stock: stockNumber,
            category: category.trim(),
            active,
          },
        })
      } else {
        await api('/products', {
          method: 'POST',
          body: {
            name: name.trim(),
            ...(description.trim() && { description: description.trim() }),
            priceInCents,
            stock: stockNumber,
            ...(category.trim() && { category: category.trim() }),
          },
        })
      }
      router.push('/admin') // mantém o botão travado até a navegação
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Erro inesperado')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-6 p-6 sm:p-8">
      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {formError}
        </p>
      )}

      <Field
        label="Nome"
        htmlFor="name"
        error={submitted ? errors.name : null}
        hint={`${name.length}/150`}
      >
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          aria-invalid={submitted && Boolean(errors.name)}
        />
      </Field>

      <Field label="Descrição (opcional)" htmlFor="description">
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input min-h-28 resize-y"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Preço (R$)"
          htmlFor="price"
          error={submitted ? errors.price : null}
        >
          <input
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="49,90"
            className="input"
            aria-invalid={submitted && Boolean(errors.price)}
          />
        </Field>

        <Field
          label="Estoque"
          htmlFor="stock"
          error={submitted ? errors.stock : null}
        >
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="input"
            aria-invalid={submitted && Boolean(errors.stock)}
          />
        </Field>
      </div>

      <Field
        label="Categoria (opcional)"
        htmlFor="category"
        error={submitted ? errors.category : null}
        hint={`${category.length}/80`}
      >
        <input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
          aria-invalid={submitted && Boolean(errors.category)}
        />
      </Field>

      {product && (
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 rounded accent-indigo-500"
          />
          Produto ativo (visível no catálogo)
        </label>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
        <Link href="/admin" className="btn btn-secondary">
          Cancelar
        </Link>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving
            ? 'Salvando…'
            : product
              ? 'Salvar alterações'
              : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string | null
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}