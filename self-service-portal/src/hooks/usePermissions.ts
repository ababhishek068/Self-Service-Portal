import { useMemo } from 'react'
import {
  erpConnectorRoles,
  gatePassReportRoles,
  leaveBalanceReportRoles,
  roleCapabilitySummary,
  roleQuickLinks,
  storeUsageReportRoles,
} from '@/config/roleAccess'
import {
  canApprove as canApproveRoles,
  hasAnyRole,
  primaryRole,
  roleLabels,
  roleShortLabels,
  type PortalRole,
} from '@/config/roles'
import { useAuth } from '@/hooks/useAuth'

/**
 * Central place for role-derived permissions so UI gating stays consistent
 * across pages. Backed entirely by the roles the backend returns on login.
 */
export function usePermissions() {
  const { employee } = useAuth()

  return useMemo(() => {
    const roles = employee?.roles ?? []
    const primary = primaryRole(roles)
    const canApprove = canApproveRoles(roles) || Boolean(employee?.canApprove)
    return {
      roles,
      primaryRole: primary,
      primaryRoleLabel: roleLabels[primary],
      primaryRoleShortLabel: roleShortLabels[primary],
      roleLabels: roles.map((role) => roleLabels[role]),
      has: (required: PortalRole | PortalRole[]) =>
        hasAnyRole(roles, Array.isArray(required) ? required : [required]),
      /** Can act on the approval queue (approve/reject documents). */
      canApprove,
      isCEO: roles.includes('ceo'),
      isHOD: roles.includes('hod'),
      isFinance: roles.includes('finance'),
      isHR: roles.includes('hr'),
      canViewLeaveBalanceReport: hasAnyRole(roles, leaveBalanceReportRoles),
      canViewStoreUsageReport: hasAnyRole(roles, storeUsageReportRoles),
      canViewGatePassReport: hasAnyRole(roles, gatePassReportRoles),
      canViewErpConnector: hasAnyRole(roles, erpConnectorRoles),
      capabilitySummary: roleCapabilitySummary[primary] ?? roleCapabilitySummary.staff ?? '',
      quickLinks: roleQuickLinks.filter((link) =>
        link.href === '/approvals' ? canApprove : hasAnyRole(roles, link.roles),
      ),
    }
  }, [employee?.canApprove, employee?.roles])
}
