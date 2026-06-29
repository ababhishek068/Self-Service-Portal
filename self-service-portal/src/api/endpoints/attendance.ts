import { authGet, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface AttendanceRow {
  id: string
  date: string
  staffName: string
  employeeNo?: string
  timeIn: string
  timeOut: string
  hoursWorked: string
  location: string
  comments: string
  highlight?: boolean
}

export async function listAttendanceRecords(): Promise<AttendanceRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: AttendanceRow[] }>('/api/attendance')
  return rows
}

export async function listTeamAttendanceRecords(): Promise<AttendanceRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: AttendanceRow[] }>('/api/attendance/team')
  return rows
}

export async function signInAttendance(location: string): Promise<AttendanceRow> {
  requireAuthApiUrl()
  return authPost<AttendanceRow>('/api/attendance/sign-in', {
    location,
    comments: location === 'Location denied' ? 'Signed in without coordinates' : 'Signed in',
  })
}

export async function signOutAttendance(location: string): Promise<AttendanceRow> {
  requireAuthApiUrl()
  return authPost<AttendanceRow>('/api/attendance/sign-out', { location })
}
