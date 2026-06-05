import { clearEssSession, essGet, essPost } from '@/api/client/essClient'
import { env } from '@/config/env'
import { mockEmployee } from '@/api/mock/mockStore'
import type { Employee } from '@/types/erp.types'

/**
 * Raw Laravel session-user shape returned by `/api/login` and `/api/me`.
 * Mirrors the array built in
 * App\Http\Controllers\Auth\AuthenticatedSessionController.
 */
export interface EssSessionUser {
  employeeNo: string
  name: string
  displayName?: string
  userID: string
  phoneNumber?: string
  Gender?: string
  userCategory?: 'staff' | 'farmer'
  isChangedPassword?: boolean
  department?: string
  imprestNo?: string
  HOD?: boolean
  CEO?: boolean
}

/** Convert the Laravel session user payload into our portal `Employee` type. */
function toEmployee(user: EssSessionUser): Employee {
  return {
    id: user.employeeNo,
    employeeNo: user.employeeNo,
    displayName: user.displayName ?? user.name ?? user.employeeNo,
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
  if (env.USE_MOCK) {
    return mockEmployee()
  }
  const { user } = await essPost<{ user: EssSessionUser }>('/api/login', { staffNo, password })
  return toEmployee(user)
}

export async function logoutRequest(): Promise<void> {
  if (env.USE_MOCK) return
  try {
    await essPost('/api/logout', {})
  } finally {
    clearEssSession()
  }
}

export async function fetchCurrentUser(): Promise<Employee | null> {
  if (env.USE_MOCK) {
    return mockEmployee()
  }
  try {
    const { user } = await essGet<{ user: EssSessionUser | null }>('/api/me')
    return user ? toEmployee(user) : null
  } catch {
    return null
  }
}
