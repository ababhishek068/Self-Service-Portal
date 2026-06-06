import { authGet } from '@/api/client/authClient'
import { env } from '@/config/env'

export interface HodTeamRequestRow {
  id: string
  employee: string
  employeeNo: string
  requestType: string
  requestNo: string
  title: string
  date: string
  status: string
}

export interface HodStaffLeaveRow {
  id: string
  employee: string
  employeeNo: string
  leaveType: string
  from: string
  to: string
  status: string
}

export async function listHodTeamRequests(): Promise<HodTeamRequestRow[]> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: HodTeamRequestRow[] }>('/api/hod/team-requests')
  return rows
}

export async function listHodStaffOnLeave(): Promise<HodStaffLeaveRow[]> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: HodStaffLeaveRow[] }>('/api/hod/staff-on-leave')
  return rows
}
