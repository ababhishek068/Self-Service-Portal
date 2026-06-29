import {
  authGet,
  authPost,
  clearApiBaseUrl,
  clearToken,
  getApiBaseUrl,
  getToken,
  setApiBaseUrl,
  setToken,
} from '@/api/client/authClient'
import { requireApplicationApiUrl, requireAuthApiUrl, requireBcApiUrl } from '@/api/requireBackend'
import { deriveRoles } from '@/config/roles'
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
  roles?: string[]
  role?: string
  email?: string
  department: string
  departmentName?: string
  branchCode?: string
  branchName?: string
  jobTitle?: string
  jobGrade?: string
  placeOfDuty?: string
  accountNumber?: string
  managerEmployeeNo?: string
  leaveBalance?: number
  responsibleCenter?: string
  permissionDepartments?: string[]
  phoneNumber: string
  gender: string
  userCategory: 'staff' | 'farmer'
  HOD: boolean
  CEO: boolean
  canApprove?: boolean
  mustChangePassword: boolean
}

export interface RegisterInput {
  staffNo: string
  firstName: string
  lastName: string
  email: string
  password: string
  department: string
  departmentName: string
  managerEmployeeNo: string
  phoneNumber: string
  gender: 'Male' | 'Female'
}

/** Map the backend auth user into the portal's richer `Employee` type. */
function toEmployee(user: AuthUser): Employee {
  const roles = deriveRoles(user)
  return {
    id: user.employeeNo,
    employeeNo: user.employeeNo,
    displayName: user.displayName || user.name || user.employeeNo,
    email: user.email ?? '',
    departmentCode: user.department ?? '',
    departmentName: user.departmentName ?? '',
    branchCode: user.branchCode ?? '',
    branchName: user.branchName ?? '',
    jobTitle: user.jobTitle ?? '',
    jobGrade: user.jobGrade ?? '',
    placeOfDuty: user.placeOfDuty ?? '',
    accountNumber: user.accountNumber ?? '',
    managerEmployeeNo: user.managerEmployeeNo ?? '',
    leaveBalance: user.leaveBalance ?? 0,
    responsibleCenter: user.responsibleCenter ?? '',
    permissionDepartments: user.permissionDepartments ?? [],
    gender: user.gender ?? '',
    phoneNumber: user.phoneNumber ?? '',
    roles,
    isCEO: roles.includes('ceo') || Boolean(user.CEO),
    isHOD: roles.includes('hod') || Boolean(user.HOD),
    canApprove: Boolean(user.canApprove),
  }
}

export type AuthProvider = 'application' | 'bc365'

export async function loginRequest(
  staffNo: string,
  password: string,
  provider: AuthProvider = 'application',
): Promise<Employee> {
  const baseUrl = provider === 'bc365' ? requireBcApiUrl() : requireApplicationApiUrl()
  setApiBaseUrl(baseUrl)
  const { token, user } = await authPost<{ token: string; user: AuthUser }>('/api/auth/login', {
    staffNo,
    password,
  })
  setToken(token)
  return toEmployee(user)
}

export async function registerRequest(input: RegisterInput): Promise<Employee> {
  const baseUrl = requireApplicationApiUrl()
  setApiBaseUrl(baseUrl)
  const { token, user } = await authPost<{ token: string; user: AuthUser }>('/api/auth/register', input)
  setToken(token)
  return toEmployee(user)
}

async function withBcPasswordApi<T>(request: () => Promise<T>) {
  const previousBaseUrl = getApiBaseUrl()
  setApiBaseUrl(requireBcApiUrl())
  try {
    return await request()
  } finally {
    if (previousBaseUrl) setApiBaseUrl(previousBaseUrl)
    else clearApiBaseUrl()
  }
}

export async function requestPasswordReset(staffNo: string): Promise<string> {
  return withBcPasswordApi(async () => {
    const response = await authPost<{ message: string }>('/api/auth/forgot-password', { staffNo })
    return response.message
  })
}

export async function resetForgottenPassword(input: {
  staffNo: string
  resetToken: string
  password: string
  passwordConfirmation: string
}): Promise<string> {
  return withBcPasswordApi(async () => {
    const response = await authPost<{ message: string }>('/api/auth/reset-password', input)
    return response.message
  })
}

export async function logoutRequest(): Promise<void> {
  requireAuthApiUrl()
  try {
    await authPost('/api/auth/logout', {})
  } catch {
    /* even if the call fails, we still drop the local token below */
  } finally {
    clearToken()
  }
}

export async function fetchCurrentUser(): Promise<Employee | null> {
  requireAuthApiUrl()
  if (!getToken()) return null
  try {
    const { user } = await authGet<{ user: AuthUser }>('/api/auth/me')
    return toEmployee(user)
  } catch {
    return null
  }
}

export async function changePasswordRequest(currentPassword: string, newPassword: string): Promise<void> {
  requireAuthApiUrl()
  await authPost('/api/auth/change-password', { currentPassword, newPassword })
}
