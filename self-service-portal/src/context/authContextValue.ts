import { createContext } from 'react'
import type { Employee } from '@/types/erp.types'

export interface AuthContextValue {
  employee: Employee | null
  isAuthenticated: boolean
  login: (employeeNo: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
