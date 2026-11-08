'use client'

import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'

export function AdminLink() {
  const { isAdmin } = useCurrentUser()
  if (!isAdmin) return null

  return (
    <Link
      href="/admin"
      className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
    >
      Admin
    </Link>
  )
}