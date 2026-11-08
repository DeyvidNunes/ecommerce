import Link from 'next/link'
import { ProductForm } from '@/components/product-form'

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="text-sm text-slate-500 transition-all duration-300 hover:text-indigo-600"
      >
        ← Voltar à lista
      </Link>
      <h2 className="mb-6 mt-4 text-2xl font-bold">Novo produto</h2>
      <ProductForm />
    </div>
  )
}