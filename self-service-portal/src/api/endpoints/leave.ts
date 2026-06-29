import { authGet, authHttp, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { PortalRequest } from '@/types/erp.types'

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
  LeaveTypeCode?: string
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

export interface SubmitLeaveResult {
  ok: boolean
  message: string
  returnValue?: string
  request?: PortalRequest
}

export async function submitLeaveRequest(input: SubmitLeaveInput): Promise<SubmitLeaveResult> {
  requireAuthApiUrl()
  return authPost<SubmitLeaveResult>('/api/leave', input)
}

export async function cancelLeaveRequest(no: string): Promise<{ ok: boolean; message: string }> {
  requireAuthApiUrl()
  return authPost<{ ok: boolean; message: string }>('/api/leave/cancel', { no })
}

export async function requestLeaveApproval(no: string): Promise<{ ok: boolean; message: string }> {
  requireAuthApiUrl()
  return authPost<{ ok: boolean; message: string }>('/api/leave/approval', { no })
}

export async function downloadLeaveStatement(
  leaveType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  requireAuthApiUrl()
  const response = await authHttp.get<Blob>('/api/leave/statement', {
    params: { leaveType },
    responseType: 'blob',
    onDownloadProgress: (event) => {
      if (event.total) onProgress?.(Math.min(95, Math.round((event.loaded / event.total) * 95)))
      else if (event.loaded > 0) onProgress?.(72)
    },
  })
  onProgress?.(100)
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `leave-statement-${leaveType}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
