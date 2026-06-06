import { authGet, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface LeaveType {
  code: string
  description: string
  days: number
  isHourly: boolean
}

export interface LeaveBalance {
  balance: number
  pendingCount: number
  isHourly: boolean
}

export async function getLeaveBalance(typeCode: string): Promise<LeaveBalance> {
  requireAuthApiUrl()
  return authGet<LeaveBalance>(`/api/leave/balance/${encodeURIComponent(typeCode)}`)
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{
    rows: Array<{ Code: string; Description: string; Days: number; Hourly?: boolean }>
  }>('/api/leave/types')
  return rows.map((row) => ({
    code: row.Code,
    description: row.Description,
    days: row.Days,
    isHourly: Boolean(row.Hourly),
  }))
}

export async function fetchRelievers(): Promise<Array<{ value: string; label: string }>> {
  requireAuthApiUrl()
  const { rows } = await authGet<{
    rows: Array<{ No: string; FirstName?: string; MiddleName?: string; LastName?: string }>
  }>('/api/leave/relievers')
  return rows.map((r) => ({
    value: r.No,
    label: `${r.No} - ${[r.FirstName, r.MiddleName, r.LastName].filter(Boolean).join(' ')}`.trim(),
  }))
}

export interface LeaveDates {
  endDate: string
  returnDate: string
  isWeekend: boolean
}

export async function getLeaveDates(
  typeCode: string,
  appliedDays: number,
  startISO: string,
  whetherIsHalfDay: '0' | '1' | '2' = '0',
): Promise<LeaveDates> {
  requireAuthApiUrl()
  const path =
    `/api/leave/dates/${encodeURIComponent(typeCode)}/${encodeURIComponent(
      String(appliedDays),
    )}/${encodeURIComponent(startISO)}/${encodeURIComponent(whetherIsHalfDay)}`
  return authGet<LeaveDates>(path)
}

export interface LeaveListRow {
  ApplicationCode: string
  LeaveType: string
  ApplicationDate?: string
  DaysApplied?: number
  StartDate?: string
  EndDate?: string
  ReturnDate?: string
  RelieverName?: string
  Status: string
}

export async function listLeaveRequests(): Promise<LeaveListRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: LeaveListRow[] }>('/api/leave')
  return rows
}

export interface SubmitLeaveInput {
  leaveType: string
  appliedDays: number
  startDate: string
  isHalfDayLeave: '0' | '1' | '2'
  reliever?: string
  reason: string
}

export async function submitLeaveRequest(input: SubmitLeaveInput): Promise<{ ok: boolean; message: string }> {
  requireAuthApiUrl()
  return authPost<{ ok: boolean; message: string }>('/api/leave', input)
}

export async function cancelLeaveRequest(no: string): Promise<{ ok: boolean; message: string }> {
  requireAuthApiUrl()
  return authPost<{ ok: boolean; message: string }>('/api/leave/cancel', { no })
}
