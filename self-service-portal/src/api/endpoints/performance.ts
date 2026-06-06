import { authGet } from '@/api/client/authClient'
import { env } from '@/config/env'

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
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: PerformanceRow[] }>('/api/performance')
  return rows
}
