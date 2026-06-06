import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/api/endpoints/auth'
import { AuthContext, type AuthContextValue } from './authContextValue'
import type { Employee } from '@/types/erp.types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** On first paint, ask the backend whether we already have a valid session/token. */
  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setEmployee(user)
      })
      .catch(() => {
        if (!cancelled) setEmployee(null)
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
