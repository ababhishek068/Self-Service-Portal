import { authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface PerformanceRow {
  id: string
  employeeNo: string
  employeeName: string
  period: string
  supervisorEmployeeNo: string
  supervisorName: string
  departmentCode: string
  departmentName: string
  status: string
}

export async function listPerformanceReviews(): Promise<PerformanceRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: PerformanceRow[] }>('/api/performance')
  return rows
}
