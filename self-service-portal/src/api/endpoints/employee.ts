import { env } from '@/config/env'
import { erpEntityPath, erpGet } from '@/api/erpConnector'
import { essGet } from '@/api/essClient'
import { fetchCurrentUser } from './auth'
import { mockDashboard, mockEmployee, mockItems, mockReportRows } from './_mockStore'
import type { Employee, ODataCollection } from '@/types/erp.types'

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

export const getDashboardSummary = async () => {
  if (env.USE_MOCK) return mockDashboard()
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
  const { rows } = await essGet<{ rows: unknown[] }>('/api/staff/items')
  return rows
}

export const getStoreUsageReport = () => mockReportRows('storeUsage')

export const getLeaveBalanceReport = () => mockReportRows('leaveBalance')

export const getGatePassLogReport = () => mockReportRows('gatePassLog')

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
