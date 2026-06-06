import { authGet, authPost } from '@/api/client/authClient'
import { env } from '@/config/env'

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
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: AttendanceRow[] }>('/api/attendance')
  return rows
}

export async function listTeamAttendanceRecords(): Promise<AttendanceRow[]> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: AttendanceRow[] }>('/api/attendance/team')
  return rows
}

export async function signInAttendance(location: string): Promise<AttendanceRow | null> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return null
  return authPost<AttendanceRow>('/api/attendance/sign-in', {
    location,
    comments: location === 'Location denied' ? 'Signed in without coordinates' : 'Signed in',
  })
}

export async function signOutAttendance(): Promise<AttendanceRow | null> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return null
  return authPost<AttendanceRow>('/api/attendance/sign-out', {})
}
