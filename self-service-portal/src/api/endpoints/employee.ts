import { authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import { fetchCurrentUser } from './auth'
import type { PortalRequest } from '@/types/erp.types'

interface DashboardSummary {
  pendingApprovals: number
  approvedDocuments: number
  rejectedDocuments: number
  leaveApplications: number
  staffClaims: number
  imprestRequisitions: number
  imprestSurrenders: number
  purchaseRequisitions: number
  storeRequisitions: number
  leaveBalance: number
  openRequests: number
  unresolved: number
  recentActivity: PortalRequest[]
}

export const getCurrentEmployee = async () => {
  requireAuthApiUrl()
  return fetchCurrentUser()
}

export const getDashboardSummary = async () => {
  requireAuthApiUrl()
  return authGet<DashboardSummary>('/api/dashboard/summary')
}

export const listItemMaster = async () => {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: unknown[] }>('/api/items')
  return rows
}

export const getStoreUsageReport = () => {
  requireAuthApiUrl()
  return authGet('/api/reports/store-usage')
}

export const getLeaveBalanceReport = () => {
  requireAuthApiUrl()
  return authGet('/api/reports/leave-balance')
}

export const getGatePassLogReport = () => {
  requireAuthApiUrl()
  return authGet('/api/reports/gate-pass-log')
}
