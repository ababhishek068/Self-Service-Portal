/**
 * Role-based access control for the Self-Service Portal.
 *
 * Roles map to the access groups described in the ERP SOW and the UAT reports
 * (staff, line manager/supervisor, HOD, finance, HR, procurement, ICT admin,
 * audit, CEO). The backend is the source of truth: on login it returns the
 * user's role(s); the frontend normalises them and adapts navigation,
 * approvals, and visible actions accordingly.
 */
export type PortalRole =
  | 'staff'
  | 'lineManager'
  | 'hod'
  | 'finance'
  | 'hr'
  | 'procurement'
  | 'ictAdmin'
  | 'audit'
  | 'ceo'

/** Every authenticated user is at least a staff member. */
export const DEFAULT_ROLE: PortalRole = 'staff'

export const allRoles: PortalRole[] = [
  'staff',
  'lineManager',
  'hod',
  'finance',
  'hr',
  'procurement',
  'ictAdmin',
  'audit',
  'ceo',
]

/** Human-readable label for each role (shown in the UI). */
export const roleLabels: Record<PortalRole, string> = {
  staff: 'Staff',
  lineManager: 'Line Manager',
  hod: 'Head of Department',
  finance: 'Finance',
  hr: 'HR',
  procurement: 'Procurement',
  ictAdmin: 'ICT Admin',
  audit: 'Audit',
  ceo: 'CEO',
}

/** Short label for compact spaces such as the top bar badge. */
export const roleShortLabels: Record<PortalRole, string> = {
  staff: 'Staff',
  lineManager: 'Manager',
  hod: 'HOD',
  finance: 'Finance',
  hr: 'HR',
  procurement: 'Procurement',
  ictAdmin: 'ICT',
  audit: 'Audit',
  ceo: 'CEO',
}

/**
 * Roles that can act on the approval queue (approve / reject documents).
 * "Manager will approve the doc" — line managers, HODs, finance, and CEO.
 */
export const approverRoles: PortalRole[] = ['lineManager', 'hod', 'finance', 'ceo']

/**
 * Maps free-form backend role strings to a `PortalRole`. Tolerant of common
 * spellings/casing so the backend can send "manager", "Line Manager",
 * "HEAD_OF_DEPARTMENT", etc. Unknown values are ignored.
 */
const roleAliases: Record<string, PortalRole> = {
  staff: 'staff',
  employee: 'staff',
  user: 'staff',
  manager: 'lineManager',
  linemanager: 'lineManager',
  'line manager': 'lineManager',
  supervisor: 'lineManager',
  immediatesupervisor: 'lineManager',
  hod: 'hod',
  head: 'hod',
  'head of department': 'hod',
  headofdepartment: 'hod',
  departmenthead: 'hod',
  finance: 'finance',
  financeofficer: 'finance',
  accountant: 'finance',
  hr: 'hr',
  humanresource: 'hr',
  humanresources: 'hr',
  procurement: 'procurement',
  purchasing: 'procurement',
  ict: 'ictAdmin',
  ictadmin: 'ictAdmin',
  admin: 'ictAdmin',
  administrator: 'ictAdmin',
  it: 'ictAdmin',
  audit: 'audit',
  auditor: 'audit',
  internalaudit: 'audit',
  ceo: 'ceo',
  executive: 'ceo',
  exec: 'ceo',
}

function normaliseRoleToken(value: string): PortalRole | null {
  const key = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  if (roleAliases[key]) return roleAliases[key]
  // also try the no-space form (e.g. "lineManager")
  const compact = key.replace(/\s/g, '')
  return roleAliases[compact] ?? null
}

interface RoleSource {
  roles?: string[] | null
  role?: string | null
  HOD?: boolean
  CEO?: boolean
}

/**
 * Derives the normalized role set from whatever the backend returns. Order of
 * precedence: explicit `roles[]`, then single `role`, then the legacy
 * HOD/CEO booleans. Always includes `staff` so every user has a baseline.
 */
export function deriveRoles(source: RoleSource): PortalRole[] {
  const collected = new Set<PortalRole>([DEFAULT_ROLE])

  const raw: string[] = []
  if (Array.isArray(source.roles)) raw.push(...source.roles)
  if (source.role) raw.push(source.role)

  for (const token of raw) {
    const role = normaliseRoleToken(token)
    if (role) collected.add(role)
  }

  // Legacy flags as a fallback so existing backends keep working.
  if (source.HOD) collected.add('hod')
  if (source.CEO) collected.add('ceo')

  return allRoles.filter((role) => collected.has(role))
}

export function hasAnyRole(userRoles: PortalRole[] | undefined, required: PortalRole[]): boolean {
  if (!required.length) return true
  if (!userRoles?.length) return false
  return required.some((role) => userRoles.includes(role))
}

export function canApprove(userRoles: PortalRole[] | undefined): boolean {
  return hasAnyRole(userRoles, approverRoles)
}

/** The most senior role a user holds — used for the single role badge. */
export function primaryRole(userRoles: PortalRole[] | undefined): PortalRole {
  if (!userRoles?.length) return DEFAULT_ROLE
  const seniority: PortalRole[] = ['ceo', 'hod', 'finance', 'hr', 'procurement', 'ictAdmin', 'audit', 'lineManager', 'staff']
  return seniority.find((role) => userRoles.includes(role)) ?? DEFAULT_ROLE
}
