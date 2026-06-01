import { createContext } from 'react'
import type { Employee } from '@/types/erp.types'

export interface AuthContextValue {
  employee: Employee | null
  isAuthenticated: boolean
  /** True once the initial `/api/me` call resolves (or immediately in mock mode). */
  bootstrapped: boolean
  /** Whether a login call is in flight. */
  submitting: boolean
  /** Last login error message, if any. */
  error: string | null
  login: (employeeNo: string, password: string) => Promise<void>
  logout: () => void | Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
