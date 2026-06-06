import { addDays, formatISO, isWeekend, parseISO } from 'date-fns'
import { env } from '@/config/env'
import { authGet, authPost } from '@/api/client/authClient'
import { essGet, essPost } from '@/api/client/essClient'
import { mockCreateRequest, mockListRequests } from '@/api/mock/mockStore'

/**
 * Reference-aligned leave types. Mirrors the rows that the Laravel ESS
 * controller pulls from Business Central's `LeaveType` web service:
 * `Code`, `Description`, `Days` (entitlement) and `Hourly` flag.
 */
export interface LeaveType {
  code: string
  description: string
  days: number
  isHourly: boolean
}

export const leaveTypeCatalog: LeaveType[] = [
  { code: 'ANNUAL', description: 'Annual Leave', days: 21, isHourly: false },
  { code: 'SICK', description: 'Sick Leave', days: 10, isHourly: false },
  { code: 'MATERNITY', description: 'Postnatal Leave/Maternity', days: 120, isHourly: false },
  { code: 'PRENATAL', description: 'Prenatal Leave/Maternity', days: 30, isHourly: false },
  { code: 'PATERNITY', description: 'Paternity Leave', days: 5, isHourly: false },
  { code: 'WEDDING', description: 'Wedding Leave', days: 5, isHourly: false },
  { code: 'MOURNING', description: 'Mourning Leave', days: 5, isHourly: false },
  { code: 'LWP', description: 'Leave Without Pay', days: 30, isHourly: false },
  { code: 'SPECIAL', description: 'Special Leave', days: 5, isHourly: false },
  { code: 'HALFDAY', description: 'Half Day Leave', days: 4, isHourly: true },
]

/**
 * Mock relievers list — replicates the active employees list returned by
 * the reference `HREmployee::wsName()` call, excluding the current user.
 */
export const relieversMock = [
  { value: 'EMP-01002', label: 'EMP-01002 - Employee 1' },
  { value: 'EMP-01018', label: 'EMP-01018 - Employee 2' },
  { value: 'EMP-01024', label: 'EMP-01024 - Employee 3' },
  { value: 'EMP-01031', label: 'EMP-01031 - Employee 4' },
  { value: 'EMP-01045', label: 'EMP-01045 - Employee 5' },
]

export interface LeaveBalance {
  balance: number
  pendingCount: number
  isHourly: boolean
}

/**
 * Mirrors `/staff/hr/leave/balance/{type}` from the reference. In the real
 * backend this aggregates `HRLeaveLedger` entries minus pending requisitions.
 */
export async function getLeaveBalance(typeCode: string): Promise<LeaveBalance> {
  if (!env.USE_MOCK) {
    if (env.AUTH_API_URL) {
      return authGet<LeaveBalance>(`/api/leave/balance/${encodeURIComponent(typeCode)}`)
    }
    return essGet<LeaveBalance>(`/api/staff/leave/balance/${encodeURIComponent(typeCode)}`)
  }
  const type = leaveTypeCatalog.find((row) => row.code === typeCode)
  if (!type) return { balance: 0, pendingCount: 0, isHourly: false }
  return {
    balance: type.days,
    pendingCount: 0,
    isHourly: type.isHourly,
  }
}

/** Fetches the catalog from BC. Falls back to the static mock when offline. */
export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  if (env.USE_MOCK) return leaveTypeCatalog
  if (env.AUTH_API_URL) {
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
  const { rows } = await essGet<{
    rows: Array<{ Code: string; Description: string; Days: number; Hourly?: boolean }>
  }>('/api/staff/leave/types')
  return rows.map((row) => ({
    code: row.Code,
    description: row.Description,
    days: row.Days,
    isHourly: Boolean(row.Hourly),
  }))
}

export async function fetchRelievers(): Promise<Array<{ value: string; label: string }>> {
  if (env.USE_MOCK) return relieversMock
  if (env.AUTH_API_URL) {
    const { rows } = await authGet<{
      rows: Array<{ No: string; FirstName?: string; MiddleName?: string; LastName?: string }>
    }>('/api/leave/relievers')
    return rows.map((r) => ({
      value: r.No,
      label: `${r.No} - ${[r.FirstName, r.MiddleName, r.LastName].filter(Boolean).join(' ')}`.trim(),
    }))
  }
  const { rows } = await essGet<{
    rows: Array<{ No: string; FirstName?: string; MiddleName?: string; LastName?: string }>
  }>('/api/staff/leave/relievers')
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

/**
 * Mirrors `/staff/hr/leave/dates/{type}/{days}/{startDate}/{whetherIsHalfDay}`
 * from the reference. We add `appliedDays` working days (skipping Sat/Sun)
 * onto the start date to produce the end date, then the next non-weekend
 * day is the return date. Half-day requests stay on the same day.
 *
 * When `VITE_USE_MOCK=false` we delegate to the Laravel endpoint, which in
 * turn calls the BC `cuStaffPortal` SOAP service for an authoritative answer.
 */
export async function getLeaveDates(
  typeCode: string,
  appliedDays: number,
  startISO: string,
  whetherIsHalfDay: '0' | '1' | '2' = '0',
): Promise<LeaveDates> {
  if (!env.USE_MOCK) {
    const path =
      `/api/leave/dates/${encodeURIComponent(typeCode)}/${encodeURIComponent(
        String(appliedDays),
      )}/${encodeURIComponent(startISO)}/${encodeURIComponent(whetherIsHalfDay)}`
    if (env.AUTH_API_URL) return authGet<LeaveDates>(path)
    return essGet<LeaveDates>(
      `/api/staff/leave/dates/${encodeURIComponent(typeCode)}/${encodeURIComponent(
        String(appliedDays),
      )}/${encodeURIComponent(startISO)}/${encodeURIComponent(whetherIsHalfDay)}`,
    )
  }
  const start = parseISO(startISO)
  if (Number.isNaN(start.getTime())) {
    return { endDate: '', returnDate: '', isWeekend: false }
  }
  if (isWeekend(start)) {
    return { endDate: '', returnDate: '', isWeekend: true }
  }

  if (whetherIsHalfDay !== '0' || appliedDays <= 0.5) {
    return {
      endDate: formatISO(start, { representation: 'date' }),
      returnDate: formatISO(nextWorkingDay(start), { representation: 'date' }),
      isWeekend: false,
    }
  }

  let remaining = Math.ceil(appliedDays) - 1
  let cursor = start
  while (remaining > 0) {
    cursor = addDays(cursor, 1)
    if (!isWeekend(cursor)) remaining -= 1
  }
  return {
    endDate: formatISO(cursor, { representation: 'date' }),
    returnDate: formatISO(nextWorkingDay(cursor), { representation: 'date' }),
    isWeekend: false,
  }
}

function nextWorkingDay(from: Date): Date {
  let cursor = addDays(from, 1)
  while (isWeekend(cursor)) cursor = addDays(cursor, 1)
  return cursor
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
  if (env.USE_MOCK) {
    const rows = await mockListRequests('leave')
    return rows.map((row) => ({
      ApplicationCode: row.requestNo,
      LeaveType: String((row.payload as { leaveType?: string }).leaveType ?? row.title),
      ApplicationDate: row.createdAt.slice(0, 10),
      DaysApplied: Number((row.payload as { appliedDays?: number }).appliedDays ?? 0),
      StartDate: String((row.payload as { startDate?: string }).startDate ?? ''),
      Status: row.status,
    }))
  }
  if (env.AUTH_API_URL) {
    const { rows } = await authGet<{ rows: LeaveListRow[] }>('/api/leave')
    return rows
  }
  const { rows } = await essGet<{ rows: LeaveListRow[] }>('/api/staff/leave')
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
  if (env.USE_MOCK) {
    const leaveLabel = leaveTypeCatalog.find((t) => t.code === input.leaveType)?.description ?? input.leaveType
    await mockCreateRequest('leave', {
      ...input,
      submit: true,
      title: `${leaveLabel} — ${input.appliedDays} day(s)`,
      amount: 0,
    })
    return { ok: true, message: 'Leave application submitted successfully.' }
  }
  if (env.AUTH_API_URL) return authPost<{ ok: boolean; message: string }>('/api/leave', input)
  return essPost<{ ok: boolean; message: string }>('/api/staff/leave', input)
}

export async function cancelLeaveRequest(no: string): Promise<{ ok: boolean; message: string }> {
  if (env.USE_MOCK) return { ok: true, message: 'Cancelled (mock).' }
  if (env.AUTH_API_URL) return authPost<{ ok: boolean; message: string }>('/api/leave/cancel', { no })
  return essPost<{ ok: boolean; message: string }>('/api/staff/leave/cancel', { no })
}
