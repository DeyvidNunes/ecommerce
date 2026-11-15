'use client'

import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'

export function AdminLink() {
  const { isAdmin } = useCurrentUser()
  if (!isAdmin) return null

  return (
    <Link
      href="/admin"
      className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-100"
    >
      Admin
    </Link>
  )
}