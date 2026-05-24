import { env } from '@/config/env'
import { erpEntityPath, erpGet } from '@/api/erpConnector'
import { mockDashboard, mockEmployee, mockItems, mockReportRows } from './_mockStore'
import type { Employee, ODataCollection } from '@/types/erp.types'

export const getCurrentEmployee = async () => {
  if (env.USE_MOCK) return mockEmployee()
  return erpGet<Employee>(`${erpEntityPath('employees')}('${env.ERP_COMPANY_ID}')`)
}

export const getDashboardSummary = () => mockDashboard()

export const listItemMaster = () => mockItems()

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
