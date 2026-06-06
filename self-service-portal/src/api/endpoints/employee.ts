import { env } from '@/config/env'
import { authGet } from '@/api/client/authClient'
import { erpEntityPath, erpGet } from '@/api/client/erpConnector'
import { essGet } from '@/api/client/essClient'
import { fetchCurrentUser } from './auth'
import { mockDashboard, mockEmployee, mockItems, mockReportRows } from '@/api/mock/mockStore'
import type { Employee, ODataCollection, PortalRequest } from '@/types/erp.types'

export const getCurrentEmployee = async () => {
  if (env.USE_MOCK) return mockEmployee()
  const employee = await fetchCurrentUser()
  if (employee) return employee
  return erpGet<Employee>(`${erpEntityPath('employees')}('${env.ERP_COMPANY_ID}')`)
}

/**
 * Real Laravel response for `/api/staff/dashboard/statistics`.
 * Field names match the existing GeneralController::dashboardStatistics().
 */
interface DashboardStatsResponse {
  totalPendingApproval: number
  totalApproved: number
  totalRejected: number
  totalLeaveReqs: number
  totalImprestReqs: number
  totalImprestSurrenderReqs: number
  totalPurchaseReqs: number
  totalStoreReqs: number
  totalTransportReqs: number
  totalClaims: number
}

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

export const getDashboardSummary = async () => {
  if (env.USE_MOCK) return mockDashboard()
  if (env.AUTH_API_URL) return authGet<DashboardSummary>('/api/dashboard/summary')
  const stats = await essGet<DashboardStatsResponse>('/api/staff/dashboard/statistics')
  return {
    pendingApprovals: stats.totalPendingApproval,
    approvedDocuments: stats.totalApproved,
    rejectedDocuments: stats.totalRejected,
    leaveApplications: stats.totalLeaveReqs,
    staffClaims: stats.totalClaims,
    imprestRequisitions: stats.totalImprestReqs,
    imprestSurrenders: stats.totalImprestSurrenderReqs,
    purchaseRequisitions: stats.totalPurchaseReqs,
    storeRequisitions: stats.totalStoreReqs,
    leaveBalance: 0,
    openRequests: stats.totalPendingApproval,
    unresolved: stats.totalRejected,
    recentActivity: [],
  }
}

export const listItemMaster = async () => {
  if (env.USE_MOCK) return mockItems()
  if (env.AUTH_API_URL) {
    const { rows } = await authGet<{ rows: unknown[] }>('/api/items')
    return rows
  }
  const { rows } = await essGet<{ rows: unknown[] }>('/api/staff/items')
  return rows
}

export const getStoreUsageReport = () => {
  if (!env.USE_MOCK && env.AUTH_API_URL) return authGet('/api/reports/store-usage')
  return mockReportRows('storeUsage')
}

export const getLeaveBalanceReport = () => {
  if (!env.USE_MOCK && env.AUTH_API_URL) return authGet('/api/reports/leave-balance')
  return mockReportRows('leaveBalance')
}

export const getGatePassLogReport = () => {
  if (!env.USE_MOCK && env.AUTH_API_URL) return authGet('/api/reports/gate-pass-log')
  return mockReportRows('gatePassLog')
}

export const listEmployees = async () => {
  if (env.USE_MOCK) {
    const employee = await mockEmployee()
    return [employee]
  }
  const result = await erpGet<ODataCollection<Employee>>(erpEntityPath('employees'), {
    $select: 'id,number,displayName,email,jobTitle',
  })
  return result.value
}
