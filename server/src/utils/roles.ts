import type { StoredUser } from '../types.js'

const approverRoles = new Set(['linemanager', 'hod', 'finance', 'ceo'])

/** Mirrors `self-service-portal/src/config/roleAccess.ts` report role groups. */
export const leaveBalanceReportRoles = ['hod', 'hr', 'ceo'] as const
export const storeUsageReportRoles = ['hod', 'procurement', 'ceo'] as const
export const gatePassReportRoles = ['hod', 'procurement', 'audit', 'ceo'] as const

function normaliseRole(value: string) {
  return value.trim().toLowerCase().replace(/[_\s-]+/g, '')
}

/** True when the user holds at least one of the allowed roles (incl. HOD/CEO flags). */
export function userHasAnyRole(user: StoredUser, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed.map(normaliseRole))
  const roles = user.roles ?? []
  if (roles.some((role) => allowedSet.has(normaliseRole(role)))) return true
  if (user.HOD && allowedSet.has('hod')) return true
  if (user.CEO && allowedSet.has('ceo')) return true
  return false
}

/** True when the user can act on the approval queue (approve / reject). */
export function canUserApprove(user: StoredUser): boolean {
  if (user.CEO || user.HOD) return true
  const roles = user.roles ?? []
  return roles.some((role) => approverRoles.has(normaliseRole(role)))
}
