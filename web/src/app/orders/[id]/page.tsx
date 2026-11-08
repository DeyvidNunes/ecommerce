import { Suspense } from 'react'
import { OrderView } from '@/components/order-view'

export default function OrderPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<div className="skeleton mt-8 h-64" />}>
        <OrderView />
      </Suspense>
    </main>
  )
}