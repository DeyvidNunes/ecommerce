'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api-error'
import type { CurrentUser } from '@/lib/types'

export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()
  const api = useApi()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }

    let active = true
    api<CurrentUser>('/auth/me')
      .then((data) => active && setUser(data))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : 'Erro inesperado'),
      )
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [isLoaded, isSignedIn, api])

  // Ajuste aqui se o campo do papel tiver outro nome
  const isAdmin = String(user?.role ?? '').toLowerCase() === 'admin'

  return { user, loading, error, isAdmin }
}