'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export function useApi() {
  const { getToken } = useAuth()

  return useCallback(
    async <T,>(
      path: string,
      options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {},
    ) => {
      const token = await getToken()
      return apiFetch<T>(path, { ...options, token })
    },
    [getToken],
  )
}