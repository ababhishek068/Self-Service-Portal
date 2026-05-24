import { useMemo, useState, type ReactNode } from 'react'
import { currentEmployee } from '@/api/endpoints/_mockStore'
import { AuthContext, type AuthContextValue } from './authContextValue'
import type { Employee } from '@/types/erp.types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(currentEmployee)

  const value = useMemo<AuthContextValue>(
    () => ({
      employee,
      isAuthenticated: Boolean(employee),
      login: async () => setEmployee(currentEmployee),
      logout: () => setEmployee(null),
    }),
    [employee],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
