import { authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

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
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: HodTeamRequestRow[] }>('/api/hod/team-requests')
  return rows
}

export async function listHodStaffOnLeave(): Promise<HodStaffLeaveRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: HodStaffLeaveRow[] }>('/api/hod/staff-on-leave')
  return rows
}
