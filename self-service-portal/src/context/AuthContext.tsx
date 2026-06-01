import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/api/endpoints/auth'
import { env } from '@/config/env'
import { currentEmployee } from '@/api/endpoints/_mockStore'
import { AuthContext, type AuthContextValue } from './authContextValue'
import type { Employee } from '@/types/erp.types'

export function AuthProvider({ children }: { children: ReactNode }) {
  // In mock mode we start as authenticated for dev-friendliness.
  const [employee, setEmployee] = useState<Employee | null>(env.USE_MOCK ? currentEmployee : null)
  const [bootstrapped, setBootstrapped] = useState(env.USE_MOCK)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** On first paint, ask the backend whether we already have a session. */
  useEffect(() => {
    if (env.USE_MOCK) return
    let cancelled = false
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setEmployee(user)
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (staffNo: string, password: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const next = await loginRequest(staffNo, password)
      setEmployee(next)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setEmployee(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      employee,
      isAuthenticated: Boolean(employee),
      bootstrapped,
      submitting,
      error,
      login,
      logout,
    }),
    [employee, bootstrapped, submitting, error, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
