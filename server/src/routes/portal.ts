import { Router } from 'express'
import {
  createRequest,
  dashboardSummary,
  deleteRequest,
  getEmployeeProfile,
  getPayrollSlip,
  getPolicyDocument,
  getRequestById,
  getRequestByNo,
  listApprovalRequests,
  listAttendance,
  listPayrollSlips,
  listPerformanceReviews,
  listPolicyDocuments,
  listRequests,
  listUsers,
  signInAttendance,
  signOutAttendance,
  updateRequestStatus,
} from '@ssp/db'
import { AppError } from '../errors.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js'
import { userStore } from '../auth/local/index.js'
import type { StoredUser } from '../types.js'
import {
  canUserApprove,
  gatePassReportRoles,
  leaveBalanceReportRoles,
  storeUsageReportRoles,
  userHasAnyRole,
} from '../utils/roles.js'

const router = Router()

const leaveTypes = [
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

const itemMaster = [
  { itemCode: 'ST032', code: 'ST032', description: 'Photocopy paper', uom: 'REAM', availableStock: 150 },
  { itemCode: 'ST067', code: 'ST067', description: 'Toner cartridge', uom: 'PCS', availableStock: 24 },
  { itemCode: 'FA112', code: 'FA112', description: 'Laptop computer', uom: 'PCS', availableStock: 6 },
]

function currentEmployeeNo(req: AuthedRequest) {
  const employeeNo = req.user?.sub
  if (!employeeNo) throw new AppError('Authentication required', 401, 'NO_TOKEN')
  return employeeNo
}

async function currentUser(req: AuthedRequest) {
  const user = await userStore.findByStaffNo(currentEmployeeNo(req))
  if (!user) throw new AppError('User no longer exists', 401, 'USER_GONE')
  return user
}

function displayName(user: StoredUser) {
  return `${user.name} ${user.lastName}`.trim() || user.employeeNo
}

async function resolveApprover(user: StoredUser) {
  if (user.managerEmployeeNo) {
    const manager = await userStore.findByStaffNo(user.managerEmployeeNo)
    if (manager) return { employeeNo: manager.employeeNo, name: displayName(manager) }
  }

  const users = await userStore.list()
  const fallback =
    users.find((candidate) => candidate.employeeNo !== user.employeeNo && candidate.HOD) ??
    users.find((candidate) => candidate.employeeNo !== user.employeeNo)

  return fallback
    ? { employeeNo: fallback.employeeNo, name: displayName(fallback) }
    : { employeeNo: user.employeeNo, name: displayName(user) }
}

function queueItem(row: Awaited<ReturnType<typeof getRequestById>> extends infer T ? NonNullable<T> : never) {
  return {
    id: row.id,
    requestNo: row.requestNo,
    module: row.requestType,
    title: row.title,
    makerEmployeeNo: row.makerEmployeeNo,
    makerName: row.makerName,
    amount: row.amount,
    status: row.status,
    submittedAt: row.submittedAt ?? row.createdAt,
    approverEmployeeNo: row.approverEmployeeNo ?? '',
    sourceDocumentNo: row.sourceDocument.documentNo,
  }
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function nextWorkingDay(date: Date) {
  let cursor = addDays(date, 1)
  while (isWeekend(cursor)) cursor = addDays(cursor, 1)
  return cursor
}

function calcHoursWorked(timeIn: string, timeOut: string): string {
  const [inH, inM] = timeIn.split(':').map(Number)
  const [outH, outM] = timeOut.split(':').map(Number)
  const minutes = outH * 60 + outM - (inH * 60 + inM)
  return minutes > 0 ? (minutes / 60).toFixed(2) : ''
}

function scopedDepartments(user: StoredUser) {
  return new Set([user.department, ...(user.permissionDepartments ?? [])].filter(Boolean))
}

function payloadText(payload: Record<string, unknown> | undefined, key: string, fallback = '') {
  const value = payload?.[key]
  return value === undefined || value === null ? fallback : String(value)
}

router.use(requireAuth)

router.get('/requests', asyncHandler(async (req: AuthedRequest, res) => {
  const module = typeof req.query.module === 'string' ? req.query.module : undefined
  const mine = req.query.mine !== 'false'
  const rows = await listRequests({ module, employeeNo: mine ? currentEmployeeNo(req) : undefined })
  res.json(rows)
}))

router.get('/requests/:id', asyncHandler(async (req, res) => {
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  res.json(row)
}))

router.post('/requests', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const approver = await resolveApprover(user)
  const body = req.body as Record<string, unknown>
  const requestType = String(body.module ?? body.requestType ?? '')
  if (!requestType) throw new AppError('Request module is required', 422, 'MODULE_REQUIRED')

  const submit = body.submit !== false
  const title = String(body.title ?? requestType)
  const amount = Number(body.amount ?? 0)
  const attachments = Array.isArray(body.attachments) ? body.attachments : []

  const row = await createRequest({
    requestType,
    title,
    status: submit ? 'Pending Approval' : 'Draft',
    makerEmployeeNo: user.employeeNo,
    makerName: displayName(user),
    departmentCode: String(body.departmentCode ?? user.department),
    departmentName: user.departmentName ?? '',
    responsibleCenter: String(body.responsibleCenter ?? user.responsibleCenter ?? ''),
    amount,
    sourceDocumentEntity: requestType,
    approverEmployeeNo: approver.employeeNo,
    approverName: approver.name,
    payload: body,
    attachments,
  })

  res.status(201).json(row)
}))

router.post('/requests/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  if (row.makerEmployeeNo !== currentEmployeeNo(req)) throw new AppError('Only the maker can cancel this request', 403)
  if (!['Draft', 'Pending Approval'].includes(row.status)) throw new AppError('Only draft or pending requests can be cancelled', 422)
  const user = await currentUser(req)
  const updated = await updateRequestStatus(row.id, {
    status: 'Cancelled',
    actorEmployeeNo: user.employeeNo,
    actorName: displayName(user),
    role: 'Maker',
  })
  res.json(updated)
}))

router.delete('/requests/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  if (row.makerEmployeeNo !== currentEmployeeNo(req)) throw new AppError('Only the maker can delete this request', 403)
  if (row.status !== 'Draft') throw new AppError('Only draft requests can be deleted', 422)
  await deleteRequest(row.id)
  res.status(204).send()
}))

router.get('/approvals', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!canUserApprove(user)) {
    throw new AppError('Approval access is required', 403, 'APPROVAL_FORBIDDEN')
  }
  const type = typeof req.query.type === 'string' ? req.query.type : 'pending'
  const rows = await listApprovalRequests({ employeeNo: currentEmployeeNo(req), type })
  res.json({ rows: rows.map(queueItem) })
}))

router.post('/approvals/:id/decide', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!canUserApprove(user)) {
    throw new AppError('Approval access is required', 403, 'APPROVAL_FORBIDDEN')
  }
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Approval item was not found', 404, 'REQUEST_NOT_FOUND')
  if (row.makerEmployeeNo === user.employeeNo) throw new AppError('Maker cannot approve own request', 403)
  if (row.approverEmployeeNo && row.approverEmployeeNo !== user.employeeNo) {
    throw new AppError('You are not assigned to approve this request', 403)
  }
  const decision = req.body?.decision === 'Rejected' ? 'Rejected' : 'Approved'
  const updated = await updateRequestStatus(row.id, {
    status: decision,
    actorEmployeeNo: user.employeeNo,
    actorName: displayName(user),
    role: 'Checker',
    comment: String(req.body?.comment ?? ''),
  })
  res.json(updated)
}))

router.get('/approvals/count/:type/:status', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!canUserApprove(user)) {
    res.json({ totalAll: 0, isNotified: false })
    return
  }
  const rows = await listApprovalRequests({ employeeNo: currentEmployeeNo(req), type: 'pending' })
  res.json({ totalAll: rows.length, isNotified: false })
}))

router.get('/dashboard/summary', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const summary = await dashboardSummary(user.employeeNo)
  res.json({ ...summary, leaveBalance: user.leaveBalance ?? 0 })
}))

router.get('/profile/details', asyncHandler(async (req: AuthedRequest, res) => {
  const profile = await getEmployeeProfile(currentEmployeeNo(req))
  if (!profile) throw new AppError('Employee profile was not found', 404, 'PROFILE_NOT_FOUND')
  res.json(profile)
}))

router.get('/leave/types', (_req, res) => {
  res.json({ rows: leaveTypes.map((row) => ({ Code: row.code, Description: row.description, Days: row.days, Hourly: row.isHourly })) })
})

router.get('/leave/relievers', asyncHandler(async (req: AuthedRequest, res) => {
  const me = currentEmployeeNo(req)
  const users = await listUsers()
  res.json({
    rows: users
      .filter((user) => user.employeeNo !== me && user.status === 'Active')
      .map((user) => ({ No: user.employeeNo, FirstName: user.name, LastName: user.lastName })),
  })
}))

router.get('/leave/balance/:type', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const type = req.params.type
  const pendingRows = await listRequests({ module: 'leave', employeeNo: user.employeeNo })
  const pendingCount = pendingRows.filter((row) => row.status === 'Pending Approval' && row.payload?.leaveType === type).length
  const leaveType = leaveTypes.find((row) => row.code === type)
  res.json({
    balance: user.leaveBalance ?? leaveType?.days ?? 0,
    pendingCount,
    isHourly: Boolean(leaveType?.isHourly),
  })
}))

router.get('/leave/dates/:type/:days/:startDate/:halfDay', (req, res) => {
  const start = parseDate(req.params.startDate)
  if (!start) {
    res.json({ endDate: '', returnDate: '', isWeekend: false })
    return
  }
  if (isWeekend(start)) {
    res.json({ endDate: '', returnDate: '', isWeekend: true })
    return
  }
  const appliedDays = Number(req.params.days)
  const halfDay = req.params.halfDay
  if (halfDay !== '0' || appliedDays <= 0.5) {
    res.json({ endDate: isoDate(start), returnDate: isoDate(nextWorkingDay(start)), isWeekend: false })
    return
  }

  let remaining = Math.ceil(appliedDays) - 1
  let cursor = start
  while (remaining > 0) {
    cursor = addDays(cursor, 1)
    if (!isWeekend(cursor)) remaining -= 1
  }
  res.json({ endDate: isoDate(cursor), returnDate: isoDate(nextWorkingDay(cursor)), isWeekend: false })
})

router.get('/leave', asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await listRequests({ module: 'leave', employeeNo: currentEmployeeNo(req) })
  res.json({
    rows: rows.map((row) => ({
      ApplicationCode: row.requestNo,
      LeaveType: String(row.payload?.leaveType ?? row.title),
      ApplicationDate: row.createdAt.slice(0, 10),
      DaysApplied: Number(row.payload?.appliedDays ?? 0),
      StartDate: String(row.payload?.startDate ?? ''),
      EndDate: String(row.payload?.endDate ?? ''),
      ReturnDate: String(row.payload?.returnDate ?? ''),
      RelieverName: String(row.payload?.reliever ?? ''),
      Status: row.status,
    })),
  })
}))

router.post('/leave', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const approver = await resolveApprover(user)
  const leaveType = leaveTypes.find((row) => row.code === req.body?.leaveType)
  await createRequest({
    requestType: 'leave',
    title: `${leaveType?.description ?? req.body?.leaveType ?? 'Leave'} — ${req.body?.appliedDays ?? 0} day(s)`,
    status: 'Pending Approval',
    makerEmployeeNo: user.employeeNo,
    makerName: displayName(user),
    departmentCode: user.department,
    departmentName: user.departmentName ?? '',
    responsibleCenter: user.responsibleCenter ?? '',
    amount: 0,
    sourceDocumentEntity: 'leave',
    approverEmployeeNo: approver.employeeNo,
    approverName: approver.name,
    payload: req.body,
    attachments: [],
  })
  res.status(201).json({ ok: true, message: 'Leave application submitted successfully.' })
}))

router.post('/leave/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  const no = String(req.body?.no ?? '')
  const row = (await getRequestByNo(no)) ?? (await getRequestById(no))
  if (!row) throw new AppError('Leave request was not found', 404)
  const user = await currentUser(req)
  await updateRequestStatus(row.id, {
    status: 'Cancelled',
    actorEmployeeNo: user.employeeNo,
    actorName: displayName(user),
    role: 'Maker',
  })
  res.json({ ok: true, message: 'Leave request cancelled.' })
}))

router.get('/items', (_req, res) => {
  res.json({ rows: itemMaster })
})

router.get('/reports/store-usage', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!userHasAnyRole(user, storeUsageReportRoles)) {
    throw new AppError('Report access is required', 403, 'REPORT_FORBIDDEN')
  }
  const rows = await listRequests({ module: 'storeRequisition' })
  const grouped = new Map()
  for (const request of rows) {
    const lines = Array.isArray(request.payload?.lines) ? request.payload.lines : []
    for (const rawLine of lines) {
      const line = rawLine as { itemCode?: string; description?: string; quantity?: number }
      const key = line.itemCode ?? 'UNKNOWN'
      const current = grouped.get(key) ?? {
        itemCode: key,
        description: line.description ?? '',
        issuedQty: 0,
        department: request.departmentName,
        month: new Date(request.createdAt).toLocaleString('en', { month: 'long', year: 'numeric' }),
      }
      current.issuedQty += Number(line.quantity ?? 0)
      grouped.set(key, current)
    }
  }
  res.json([...grouped.values()])
}))

router.get('/reports/leave-balance', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!userHasAnyRole(user, leaveBalanceReportRoles)) {
    throw new AppError('Report access is required', 403, 'REPORT_FORBIDDEN')
  }
  const users = await listUsers()
  res.json(users.map((user) => ({
    employeeNo: user.employeeNo,
    name: `${user.name} ${user.lastName}`.trim(),
    annualBalance: user.leaveBalance,
    used: 0,
    department: user.departmentName,
  })))
}))

router.get('/reports/gate-pass-log', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!userHasAnyRole(user, gatePassReportRoles)) {
    throw new AppError('Report access is required', 403, 'REPORT_FORBIDDEN')
  }
  const rows = await listRequests({ module: 'gatePass' })
  res.json(rows.map((row) => ({
    gatePassNo: row.requestNo,
    type: row.payload?.gatePassType ?? '',
    assetTag: row.payload?.assetTagNumber ?? '',
    destination: row.payload?.destination ?? '',
    returnDate: row.payload?.returnDate ?? '-',
    status: row.status,
  })))
}))

router.get('/work-tickets', asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await listRequests({ module: 'transport', employeeNo: currentEmployeeNo(req) })
  res.json({
    rows: rows.map((row) => ({
      id: row.id,
      ticketNo: `WT-${row.requestNo}`,
      vehicle: payloadText(row.payload, 'vehicleNo', payloadText(row.payload, 'transportType', 'Pending assignment')),
      driver: payloadText(row.payload, 'driverName', row.approverName ?? 'Pending dispatch'),
      date: payloadText(row.payload, 'tripDate', row.createdAt.slice(0, 10)),
      status: row.status,
    })),
  })
}))

router.get('/hod/team-requests', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!user.HOD && !user.roles?.includes('hod')) throw new AppError('HOD access is required', 403)
  const departments = scopedDepartments(user)
  const rows = (await listRequests()).filter((row) => departments.has(row.departmentCode))
  res.json({
    rows: rows.map((row) => ({
      id: row.id,
      employee: row.makerName,
      employeeNo: row.makerEmployeeNo,
      requestType: row.requestType,
      requestNo: row.requestNo,
      title: row.title,
      date: row.createdAt.slice(0, 10),
      status: row.status,
    })),
  })
}))

router.get('/hod/staff-on-leave', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!user.HOD && !user.roles?.includes('hod')) throw new AppError('HOD access is required', 403)
  const departments = scopedDepartments(user)
  const rows = (await listRequests({ module: 'leave' })).filter(
    (row) => departments.has(row.departmentCode) && ['Approved', 'Pending Approval'].includes(row.status),
  )
  res.json({
    rows: rows.map((row) => ({
      id: row.id,
      employee: row.makerName,
      employeeNo: row.makerEmployeeNo,
      leaveType: payloadText(row.payload, 'leaveType', row.title),
      from: payloadText(row.payload, 'startDate'),
      to: payloadText(row.payload, 'endDate', payloadText(row.payload, 'startDate')),
      status: row.status,
    })),
  })
}))

router.get('/performance', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const rows = await listPerformanceReviews(
    user.HOD || user.roles?.includes('hod')
      ? { departmentCode: user.department }
      : { employeeNo: user.employeeNo },
  )
  res.json({ rows })
}))

router.get('/payroll/payslip', asyncHandler(async (req: AuthedRequest, res) => {
  const year = Number(req.query.year)
  const month = typeof req.query.month === 'string' ? req.query.month : ''
  if (!year || !month) throw new AppError('Payroll year and month are required', 422)
  const row = await getPayrollSlip({ employeeNo: currentEmployeeNo(req), year, month })
  if (!row) throw new AppError('Payslip was not found for the selected period', 404, 'PAYSLIP_NOT_FOUND')
  res.json(row)
}))

router.get('/payroll/master-roll', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!user.CEO && !user.roles?.includes('ceo')) throw new AppError('CEO access is required', 403)
  const year = Number(req.query.year)
  const month = typeof req.query.month === 'string' ? req.query.month : ''
  if (!year || !month) throw new AppError('Payroll year and month are required', 422)
  const rows = await listPayrollSlips({ year, month })
  const summary = rows.reduce(
    (total, row) => ({
      headcount: total.headcount + 1,
      grossPay: total.grossPay + row.grossPay,
      totalDeductions: total.totalDeductions + row.totalDeductions,
      netPay: total.netPay + row.netPay,
    }),
    { headcount: 0, grossPay: 0, totalDeductions: 0, netPay: 0 },
  )
  res.json({ rows, summary })
}))

router.get('/documents', asyncHandler(async (_req, res) => {
  const rows = await listPolicyDocuments()
  res.json({ rows })
}))

router.get('/documents/:id/download', asyncHandler(async (req, res) => {
  const doc = await getPolicyDocument(req.params.id)
  if (!doc) throw new AppError('Document was not found', 404, 'DOCUMENT_NOT_FOUND')
  const fileName = doc.fileName.replace(/"/g, '')
  res.setHeader('Content-Type', doc.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.send(doc.content ?? '')
}))

router.get('/attendance', asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await listAttendance({ employeeNo: currentEmployeeNo(req) })
  res.json({ rows })
}))

router.get('/attendance/team', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const rows = user.HOD || user.roles?.includes('hod')
    ? await listAttendance({ departmentCode: user.department })
    : []
  res.json({ rows })
}))

router.post('/attendance/sign-in', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const now = new Date()
  const row = await signInAttendance({
    employeeNo: user.employeeNo,
    staffName: displayName(user),
    date: now.toISOString().slice(0, 10),
    timeIn: now.toTimeString().slice(0, 5),
    location: String(req.body?.location ?? ''),
    comments: String(req.body?.comments ?? 'Signed in'),
    departmentCode: user.department,
    departmentName: user.departmentName ?? '',
    managerEmployeeNo: user.managerEmployeeNo ?? '',
  })
  res.status(201).json(row)
}))

router.post('/attendance/sign-out', asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await listAttendance({ employeeNo: currentEmployeeNo(req) })
  const openRow = rows.find((row) => !row.timeOut)
  if (!openRow) throw new AppError('No open sign-in record was found for sign-out', 404)
  const timeOut = new Date().toTimeString().slice(0, 5)
  const row = await signOutAttendance({
    employeeNo: currentEmployeeNo(req),
    date: openRow.date,
    timeOut,
    hoursWorked: calcHoursWorked(openRow.timeIn, timeOut),
  })
  res.json(row)
}))

export default router
