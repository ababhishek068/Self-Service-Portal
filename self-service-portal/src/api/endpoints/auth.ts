import { authGet, authPost, clearToken, getToken, setToken } from '@/api/client/authClient'
import { env } from '@/config/env'
import { mockEmployee } from '@/api/mock/mockStore'
import type { Employee } from '@/types/erp.types'

/**
 * Canonical user shape returned by our backend's auth endpoints
 * (and, later, by the Business Central provider). The contract is identical
 * regardless of which provider authenticated the user.
 */
export interface AuthUser {
  employeeNo: string
  name: string
  displayName: string
  department: string
  phoneNumber: string
  gender: string
  userCategory: 'staff' | 'farmer'
  HOD: boolean
  CEO: boolean
  mustChangePassword: boolean
}

/** True when a real auth backend is configured; otherwise we use mock login. */
const useRealAuth = Boolean(env.AUTH_API_URL)

/** Map the backend auth user into the portal's richer `Employee` type. */
function toEmployee(user: AuthUser): Employee {
  return {
    id: user.employeeNo,
    employeeNo: user.employeeNo,
    displayName: user.displayName || user.name || user.employeeNo,
    email: '',
    departmentCode: user.department ?? '',
    departmentName: '',
    branchCode: '',
    branchName: '',
    jobTitle: '',
    jobGrade: '',
    placeOfDuty: '',
    accountNumber: '',
    managerEmployeeNo: '',
    leaveBalance: 0,
    responsibleCenter: '',
    permissionDepartments: [],
    isCEO: Boolean(user.CEO),
    isHOD: Boolean(user.HOD),
  }
}

export async function loginRequest(staffNo: string, password: string): Promise<Employee> {
  if (!useRealAuth) {
    return mockEmployee()
  }
  const { token, user } = await authPost<{ token: string; user: AuthUser }>('/api/auth/login', {
    staffNo,
    password,
  })
  setToken(token)
  return toEmployee(user)
}

export async function logoutRequest(): Promise<void> {
  if (!useRealAuth) return
  try {
    await authPost('/api/auth/logout', {})
  } catch {
    /* even if the call fails, we still drop the local token below */
  } finally {
    clearToken()
  }
}

export async function fetchCurrentUser(): Promise<Employee | null> {
  if (!useRealAuth) {
    return mockEmployee()
  }
  if (!getToken()) return null
  try {
    const { user } = await authGet<{ user: AuthUser }>('/api/auth/me')
    return toEmployee(user)
  } catch {
    return null
  }
}

export async function changePasswordRequest(currentPassword: string, newPassword: string): Promise<void> {
  if (!useRealAuth) return
  await authPost('/api/auth/change-password', { currentPassword, newPassword })
}
