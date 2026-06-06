import { approverRoles, type PortalRole } from '@/config/roles'

/** Roles that can open department/HR oversight reports. */
export const leaveBalanceReportRoles: PortalRole[] = ['hod', 'hr', 'ceo']

/** Roles that can open store/facility usage reports. */
export const storeUsageReportRoles: PortalRole[] = ['hod', 'procurement', 'ceo']

/** Roles that can open gate pass logs. */
export const gatePassReportRoles: PortalRole[] = ['hod', 'procurement', 'audit', 'ceo']

/** Roles that can open the ERP connector screen. */
export const erpConnectorRoles: PortalRole[] = ['ictAdmin', 'ceo']

export interface RoleQuickLink {
  label: string
  href: string
  description: string
  roles: PortalRole[]
}

/**
 * Shortcuts shown on the dashboard — only links the current role is allowed
 * to use. Staff always see self-service actions; managers/HOD/CEO see extras.
 */
export const roleQuickLinks: RoleQuickLink[] = [
  {
    label: 'Submit leave',
    href: '/hr/leave-request',
    description: 'Apply for annual, sick, or other leave types.',
    roles: ['staff'],
  },
  {
    label: 'New imprest request',
    href: '/finance/imprest',
    description: 'Raise a staff advance requisition.',
    roles: ['staff'],
  },
  {
    label: 'View payslip',
    href: '/hr/payslip',
    description: 'Generate your monthly payslip.',
    roles: ['staff'],
  },
  {
    label: 'Approval queue',
    href: '/approvals',
    description: 'Review and approve or reject team requests.',
    roles: approverRoles,
  },
  {
    label: 'Staff on leave',
    href: '/hod/staff-on-leave',
    description: 'See who in your department is currently on leave.',
    roles: ['hod'],
  },
  {
    label: 'Team requests',
    href: '/hod/team-requests',
    description: 'Monitor requests submitted by your department.',
    roles: ['hod'],
  },
  {
    label: 'Payroll master roll',
    href: '/ceo/master-roll',
    description: 'Executive payroll summary for the selected period.',
    roles: ['ceo'],
  },
  {
    label: 'Leave balance report',
    href: '/reports/leave-balance',
    description: 'Department leave balances across staff.',
    roles: leaveBalanceReportRoles,
  },
]

/** One-line summary of what each primary role can do in the portal. */
export const roleCapabilitySummary: Partial<Record<PortalRole, string>> = {
  staff: 'Submit HR, finance, and facility requests and track your own activity.',
  lineManager: 'Everything staff can do, plus approve or reject team requests.',
  hod: 'Manager access plus department team views, attendance, and HR reports.',
  finance: 'Staff self-service plus finance approval authority on pending documents.',
  hr: 'Staff self-service plus HR reports such as leave balances.',
  procurement: 'Staff self-service plus store usage and gate pass reports.',
  ictAdmin: 'Staff self-service plus ERP connector tools.',
  audit: 'Staff self-service plus read-only audit reports.',
  ceo: 'Full executive access including payroll master roll and all reports.',
}
