import { Router } from 'express'
import {
  createRequest,
  dashboardSummary,
  deleteRequest,
  createProfileAttachment,
  getEmployeeProfile,
  getPayrollSlip,
  getPolicyDocument,
  getRequestById,
  getRequestAttachment,
  getRequestByNo,
  listProfileAttachments,
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
  updateRequestHeader,
  addRequestLine,
  updateRequestLine,
  setRequestLines,
  deleteRequestLine,
  addRequestAttachment,
  deleteRequestAttachment,
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
import { createTextPdf } from '../utils/pdf.js'

const router = Router()
const MAX_ATTACHMENT_BYTES = 10_000_000
const MAX_TOTAL_ATTACHMENT_BYTES = 20_000_000
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'])

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

function findLeaveType(typeCode: string) {
  return leaveTypes.find((row) => row.code === typeCode)
}

/** Annual allocation from the user record, falling back to the leave-type default when unset (0). */
function annualLeaveEntitlement(user: StoredUser, leaveTypeDays: number): number {
  const stored = user.leaveBalance ?? 0
  return stored > 0 ? stored : leaveTypeDays
}

function leaveEntitlement(user: StoredUser, typeCode: string) {
  const leaveType = findLeaveType(typeCode)
  if (!leaveType) return { leaveType: undefined, entitlement: 0, isHourly: false }
  const entitlement =
    typeCode === 'ANNUAL' ? annualLeaveEntitlement(user, leaveType.days) : leaveType.days
  return { leaveType, entitlement, isHourly: leaveType.isHourly }
}

const itemMaster = [
  { itemCode: 'ST032', code: 'ST032', description: 'Photocopy paper', uom: 'REAM', availableStock: 150 },
  { itemCode: 'ST067', code: 'ST067', description: 'Toner cartridge', uom: 'PCS', availableStock: 24 },
  { itemCode: 'FA112', code: 'FA112', description: 'Laptop computer', uom: 'PCS', availableStock: 6 },
]

const lookupCatalogs: Record<string, Array<{ value: string; label: string; meta?: Record<string, unknown> }>> = {
  'imprest-types': [
    { value: 'TRAVEL', label: 'TRAVEL - Travel' },
    { value: 'PER DIEM', label: 'PER DIEM - Per diem' },
    { value: 'ACCOMMODATION', label: 'ACCOMMODATION - Accommodation' },
  ],
  'travel-destinations': [
    { value: 'LOCAL', label: 'LOCAL - Local travel' },
    { value: 'FIELD', label: 'FIELD - Field destination' },
  ],
  'claim-types': [
    { value: 'MEDICAL', label: 'MEDICAL - Medical Claim', meta: { accountNo: '61000' } },
    { value: 'TRAVEL', label: 'TRAVEL - Travel Claim', meta: { accountNo: '62000' } },
    { value: 'OTHER', label: 'OTHER - Other Claim', meta: { accountNo: '69999' } },
  ],
  'petty-cash-types': [
    { value: 'TRANSPORT', label: 'TRANSPORT - Transport' },
    { value: 'STATIONERY', label: 'STATIONERY - Stationery' },
    { value: 'OTHER', label: 'OTHER - Other' },
  ],
  'gl-accounts': [
    { value: '61000', label: '61000 - Medical expenses' },
    { value: '62000', label: '62000 - Travel expenses' },
    { value: '69999', label: '69999 - Other expenses' },
  ],
  locations: [
    { value: 'MAIN', label: 'MAIN - Main Store' },
    { value: 'BRANCH', label: 'BRANCH - Branch Store' },
  ],
  'regular-locations': [
    { value: 'MAIN', label: 'MAIN - Main Store' },
    { value: 'BRANCH', label: 'BRANCH - Branch Store' },
  ],
  'in-transit-locations': [{ value: 'TRANSIT', label: 'TRANSIT - In Transit' }],
  items: itemMaster.map((row) => ({ value: row.itemCode, label: `${row.itemCode} - ${row.description}` })),
  assets: [{ value: 'FA112', label: 'FA112 - Laptop computer' }],
  services: [
    { value: '61000', label: '61000 - Medical expenses' },
    { value: '62000', label: '62000 - Travel expenses' },
  ],
  'shipping-agents': [{ value: 'INTERNAL', label: 'INTERNAL - Internal Fleet' }],
  'responsibility-centers': [{ value: 'HQ', label: 'HQ - Head Office' }],
  vehicles: [{ value: 'KAA-001A', label: 'KAA-001A - Pool Vehicle' }],
  'fuel-cards': [{ value: 'FC-001', label: 'FC-001' }],
  vendors: [{ value: 'V0001', label: 'V0001 - Fuel Vendor' }],
  'training-courses': [{ value: 'COURSE-001', label: 'COURSE-001 - Staff Development' }],
  'payroll-posting-groups': [{ value: 'GENERAL', label: 'GENERAL - General Staff' }],
  'bank-accounts': [
    { value: 'BANK-OPERATING', label: 'BANK-OPERATING - Operating Account' },
    { value: 'BANK-PETTY', label: 'BANK-PETTY - Petty Cash Account' },
  ],
  sectors: [{ value: 'CORP', label: 'CORP - Corporate' }],
  divisions: [{ value: 'HQ', label: 'HQ - Head Office' }],
  departments: [{ value: 'ADMIN', label: 'ADMIN - Administration' }],
  'posted-receipts': [{ value: 'RCPT-001', label: 'RCPT-001 - Cash receipt' }],
}

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

function calculateLeaveDates(appliedDays: number, startDate: string, halfDay: string) {
  const start = parseDate(startDate)
  if (!start) throw new AppError('Start date is invalid', 422, 'INVALID_LEAVE_START_DATE')
  if (isWeekend(start)) throw new AppError('Leave start date cannot be on a weekend', 422, 'LEAVE_WEEKEND_START')

  if (halfDay !== '0' || appliedDays <= 0.5) {
    return {
      endDate: isoDate(start),
      returnDate: isoDate(nextWorkingDay(start)),
    }
  }

  let remaining = Math.ceil(appliedDays) - 1
  let cursor = start
  while (remaining > 0) {
    cursor = addDays(cursor, 1)
    if (!isWeekend(cursor)) remaining -= 1
  }

  return {
    endDate: isoDate(cursor),
    returnDate: isoDate(nextWorkingDay(cursor)),
  }
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

function safeFileName(value: unknown) {
  return String(value ?? 'attachment')
    .replace(/[^\w.\- ]+/g, '_')
    .slice(0, 180)
}

function normalizeAttachments(value: unknown) {
  if (!Array.isArray(value)) return []
  let totalSize = 0
  return value.map((raw) => {
    const attachment = raw as Record<string, unknown>
    const fileName = safeFileName(attachment.fileName)
    const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
      throw new AppError(
        `${fileName} is not an allowed attachment type`,
        422,
        'INVALID_ATTACHMENT_TYPE',
      )
    }
    const contentBase64 = String(attachment.contentBase64 ?? '').replace(/^data:[^,]+,/, '')
    if (!contentBase64) {
      throw new AppError(`${fileName} has no file content`, 422, 'EMPTY_ATTACHMENT')
    }
    const size = Buffer.from(contentBase64, 'base64').byteLength
    if (size <= 0 || size > MAX_ATTACHMENT_BYTES) {
      throw new AppError(
        `${fileName} exceeds the 10 MB attachment limit`,
        422,
        'ATTACHMENT_TOO_LARGE',
      )
    }
    totalSize += size
    if (totalSize > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new AppError(
        'Combined attachments exceed the 20 MB request limit',
        422,
        'ATTACHMENTS_TOO_LARGE',
      )
    }
    return {
      fileName,
      fileType: String(
        attachment.fileType ?? attachment.mimeType ?? 'application/octet-stream',
      ),
      size,
      description: String(attachment.description ?? fileName).slice(0, 180),
      contentBase64,
    }
  })
}

function attachmentPayloadMetadata(
  body: Record<string, unknown>,
  attachments: ReturnType<typeof normalizeAttachments>,
) {
  return {
    ...body,
    attachments: attachments.map(({ contentBase64: _content, ...metadata }) => metadata),
  }
}

function attachmentCanBeRead(
  attachment: NonNullable<Awaited<ReturnType<typeof getRequestAttachment>>>,
  user: StoredUser,
) {
  if (attachment.scope === 'profile') return attachment.ownerKey === user.employeeNo
  return (
    attachment.request?.makerEmployeeNo === user.employeeNo ||
    attachment.request?.approverEmployeeNo === user.employeeNo ||
    canUserApprove(user)
  )
}

async function userCanApproveWorkflow(user: StoredUser) {
  if (canUserApprove(user)) return true
  const directReports = await userStore.listDirectReports(user.employeeNo)
  return directReports.length > 0
}

router.use(requireAuth)

router.get('/lookups/:catalog', asyncHandler(async (req: AuthedRequest, res) => {
  if (req.params.catalog === 'employees') {
    const users = await listUsers()
    res.json({
      rows: users
        .filter((user) => user.status === 'Active')
        .map((user) => ({
          value: user.employeeNo,
          label: `${user.employeeNo} - ${displayName(user)}`,
          meta: { jobTitle: user.jobTitle ?? '' },
        })),
    })
    return
  }
  const rows = lookupCatalogs[req.params.catalog]
  if (!rows) throw new AppError(`Unsupported lookup catalog: ${req.params.catalog}`, 404)
  res.json({ rows })
}))

router.get('/requests', asyncHandler(async (req: AuthedRequest, res) => {
  const module = typeof req.query.module === 'string' ? req.query.module : undefined
  const mine = req.query.mine !== 'false'
  const rows = await listRequests({ module, employeeNo: mine ? currentEmployeeNo(req) : undefined })
  res.json(rows)
}))

router.get('/requests/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const requestNo = req.params.id.startsWith('leave-')
    ? req.params.id.slice('leave-'.length)
    : ''
  const row =
    (await getRequestById(req.params.id)) ??
    (requestNo ? await getRequestByNo(requestNo) : null)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  const user = await currentUser(req)
  const canRead =
    row.makerEmployeeNo === user.employeeNo ||
    row.approverEmployeeNo === user.employeeNo ||
    canUserApprove(user)
  if (!canRead) throw new AppError('You cannot access this request', 403, 'REQUEST_FORBIDDEN')
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
  const attachments = normalizeAttachments(body.attachments)
  const payload = attachmentPayloadMetadata(body, attachments) as Record<string, unknown>

  // ESS imprest surrender auto-generates its lines from the selected (posted) imprest.
  if (requestType === 'imprestSurrender' && body.imprest) {
    const imprest = await getRequestByNo(String(body.imprest))
    if (!imprest || imprest.makerEmployeeNo !== user.employeeNo) {
      throw new AppError('Selected imprest was not found', 404, 'IMPREST_NOT_FOUND')
    }
    const imprestLines = Array.isArray(imprest.payload?.lines)
      ? (imprest.payload.lines as Record<string, unknown>[])
      : []
    payload.lines = imprestLines.map((line, index) => ({
      id: `sl-${index + 1}`,
      lineNo: (index + 1) * 10000,
      accountNo: String(line.accountNo ?? line.advanceType ?? ''),
      surrenderDocNo: imprest.requestNo,
      accountName: String(line.accountName ?? line.destination ?? ''),
      amount: Number(line.amount ?? 0),
      actualSpent: '',
      cashReceiptNo: '',
      cashReceiptAmount: '',
    }))
    payload.imprestNo = imprest.requestNo
  }

  const lineAmount = Array.isArray(payload.lines)
    ? (payload.lines as Record<string, unknown>[]).reduce((sum, line) => sum + Number(line.amount ?? 0), 0)
    : undefined
  const amount = lineAmount ?? Number(body.amount ?? 0)

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
    payload,
    attachments,
  })

  res.status(201).json(row)
}))

router.post('/requests/:id/submit', asyncHandler(async (req: AuthedRequest, res) => {
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  if (row.makerEmployeeNo !== currentEmployeeNo(req)) {
    throw new AppError('Only the maker can submit this request', 403)
  }
  if (row.status !== 'Draft') {
    throw new AppError('Only draft requests can be submitted', 422)
  }
  const user = await currentUser(req)
  const updated = await updateRequestStatus(row.id, {
    status: 'Pending Approval',
    actorEmployeeNo: user.employeeNo,
    actorName: displayName(user),
    role: 'Maker',
  })
  res.json(updated)
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

/**
 * Load a request the current user may still edit (maker + Draft/Open).
 * ESS keeps lines/attachments editable until the document is sent for approval.
 */
async function loadEditableRequest(req: AuthedRequest, { editableStatuses = ['Draft'] }: { editableStatuses?: string[] } = {}) {
  const row = await getRequestById(req.params.id)
  if (!row) throw new AppError('Request was not found', 404, 'REQUEST_NOT_FOUND')
  if (row.makerEmployeeNo !== currentEmployeeNo(req)) {
    throw new AppError('Only the maker can modify this request', 403, 'REQUEST_FORBIDDEN')
  }
  if (!editableStatuses.includes(row.status)) {
    throw new AppError('This request can no longer be edited', 422, 'REQUEST_LOCKED')
  }
  return row
}

router.patch('/requests/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req)
  const { module: _m, requestType: _r, lines: _l, attachments: _a, ...patch } = req.body as Record<string, unknown>
  const updated = await updateRequestHeader(req.params.id, patch)
  res.json(updated)
}))

router.post('/requests/:id/lines', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req)
  const line = req.body as Record<string, unknown>
  const updated = await addRequestLine(req.params.id, line)
  res.status(201).json(updated)
}))

router.put('/requests/:id/lines', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req)
  const lines = Array.isArray(req.body?.lines) ? (req.body.lines as Record<string, unknown>[]) : []
  const updated = await setRequestLines(req.params.id, lines)
  res.json(updated)
}))

router.patch('/requests/:id/lines/:lineId', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req)
  const updated = await updateRequestLine(req.params.id, req.params.lineId, req.body as Record<string, unknown>)
  res.json(updated)
}))

router.delete('/requests/:id/lines/:lineId', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req)
  const updated = await deleteRequestLine(req.params.id, req.params.lineId)
  res.json(updated)
}))

router.post('/requests/:id/attachments', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req, { editableStatuses: ['Draft', 'Pending Approval'] })
  const [attachment] = normalizeAttachments([req.body])
  if (!attachment) throw new AppError('Attachment is required', 422)
  const updated = await addRequestAttachment(req.params.id, {
    ...attachment,
    uploadedBy: currentEmployeeNo(req),
  })
  res.status(201).json(updated)
}))

router.delete('/requests/:id/attachments/:attachmentId', asyncHandler(async (req: AuthedRequest, res) => {
  await loadEditableRequest(req, { editableStatuses: ['Draft', 'Pending Approval'] })
  const updated = await deleteRequestAttachment(req.params.id, req.params.attachmentId)
  res.json(updated)
}))

router.get('/attachments/:id/download', asyncHandler(async (req: AuthedRequest, res) => {
  const attachment = await getRequestAttachment(req.params.id)
  if (!attachment) throw new AppError('Attachment was not found', 404, 'ATTACHMENT_NOT_FOUND')
  const user = await currentUser(req)
  if (!attachmentCanBeRead(attachment, user)) {
    throw new AppError('You cannot access this attachment', 403, 'ATTACHMENT_FORBIDDEN')
  }
  res.setHeader('Content-Type', attachment.mimeType)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFileName(attachment.fileName).replaceAll('"', '')}"`,
  )
  res.send(Buffer.from(attachment.contentBase64, 'base64'))
}))

router.get('/requests/:requestId/attachments/:id/download', asyncHandler(async (req: AuthedRequest, res) => {
  const attachment = await getRequestAttachment(req.params.id)
  if (
    !attachment ||
    !attachment.request ||
    attachment.request.id !== req.params.requestId
  ) {
    throw new AppError('Attachment was not found', 404, 'ATTACHMENT_NOT_FOUND')
  }
  const user = await currentUser(req)
  if (!attachmentCanBeRead(attachment, user)) {
    throw new AppError('You cannot access this attachment', 403, 'ATTACHMENT_FORBIDDEN')
  }
  res.setHeader('Content-Type', attachment.mimeType)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFileName(attachment.fileName).replaceAll('"', '')}"`,
  )
  res.send(Buffer.from(attachment.contentBase64, 'base64'))
}))

router.get('/approvals', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!(await userCanApproveWorkflow(user))) {
    throw new AppError('Approval access is required', 403, 'APPROVAL_FORBIDDEN')
  }
  const type = typeof req.query.type === 'string' ? req.query.type : 'pending'
  const rows = await listApprovalRequests({ employeeNo: currentEmployeeNo(req), type })
  res.json({ rows: rows.map(queueItem) })
}))

router.post('/approvals/:id/decide', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!(await userCanApproveWorkflow(user))) {
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
  if (!(await userCanApproveWorkflow(user))) {
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
  const user = await currentUser(req)
  const profile = await getEmployeeProfile(currentEmployeeNo(req))
  res.json(profile ?? {
    employeeNo: user.employeeNo,
    sector: '',
    division: '',
    district: '',
    maritalStatus: '',
    employmentType: '',
    dateOfJoin: '',
    contractStartDate: '',
    contractEndDate: '',
    probationEndDate: '',
    nextOfKin: [],
    employmentHistory: [],
    qualifications: [],
    assignedAssets: [],
  })
}))

router.get('/profile/attachments', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ rows: await listProfileAttachments(currentEmployeeNo(req)) })
}))

router.post('/profile/attachments', asyncHandler(async (req: AuthedRequest, res) => {
  const [attachment] = normalizeAttachments([req.body])
  if (!attachment) throw new AppError('Attachment is required', 422)
  const created = await createProfileAttachment({
    employeeNo: currentEmployeeNo(req),
    uploadedBy: currentEmployeeNo(req),
    ...attachment,
    mimeType: attachment.fileType,
  })
  res.status(201).json(created)
}))

router.get('/profile/attachments/:id/download', asyncHandler(async (req: AuthedRequest, res) => {
  const attachment = await getRequestAttachment(req.params.id)
  if (!attachment || attachment.scope !== 'profile') {
    throw new AppError('Employee attachment was not found', 404, 'ATTACHMENT_NOT_FOUND')
  }
  const user = await currentUser(req)
  if (!attachmentCanBeRead(attachment, user)) {
    throw new AppError('You cannot access this attachment', 403, 'ATTACHMENT_FORBIDDEN')
  }
  res.setHeader('Content-Type', attachment.mimeType)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFileName(attachment.fileName).replaceAll('"', '')}"`,
  )
  res.send(Buffer.from(attachment.contentBase64, 'base64'))
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
  const leaveRows = await listRequests({ module: 'leave', employeeNo: user.employeeNo })
  const matchingRows = leaveRows.filter((row) => row.payload?.leaveType === type)
  const pendingCount = matchingRows.filter((row) => row.status === 'Pending Approval').length
  const approvedUsed = matchingRows
    .filter((row) => ['Approved', 'Posted'].includes(row.status))
    .reduce((sum, row) => sum + Number(row.payload?.appliedDays ?? 0), 0)
  const { entitlement, isHourly } = leaveEntitlement(user, type)
  res.json({
    balance: Math.max(0, entitlement - approvedUsed),
    pendingCount,
    isHourly,
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
      LeaveType: String(row.payload?.leaveTypeDescription ?? row.payload?.leaveType ?? row.title),
      LeaveTypeCode: String(row.payload?.leaveType ?? ''),
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
  const leaveTypeCode = String(req.body?.leaveType ?? '')
  const { leaveType, entitlement } = leaveEntitlement(user, leaveTypeCode)
  if (!leaveType) throw new AppError('Leave type is invalid', 422, 'INVALID_LEAVE_TYPE')

  const appliedDays = Number(req.body?.appliedDays ?? 0)
  if (!Number.isFinite(appliedDays) || appliedDays <= 0) {
    throw new AppError('Applied days must be greater than zero', 422, 'INVALID_LEAVE_DAYS')
  }

  const reason = String(req.body?.reason ?? '').trim()
  if (!reason) throw new AppError('Leave reason is required', 422, 'MISSING_REASON')

  const startDate = String(req.body?.startDate ?? '').trim()
  if (!startDate) throw new AppError('Start date is required', 422, 'MISSING_START_DATE')

  const leaveRows = await listRequests({ module: 'leave', employeeNo: user.employeeNo })
  const matchingRows = leaveRows.filter((row) => row.payload?.leaveType === leaveTypeCode)
  const pendingCount = matchingRows.filter((row) => row.status === 'Pending Approval').length
  if (pendingCount > 0) {
    throw new AppError(
      'You cannot apply a new leave while there is another one of the same type that is pending approval.',
      422,
      'PENDING_LEAVE_EXISTS',
    )
  }

  const approvedUsed = matchingRows
    .filter((row) => ['Approved', 'Posted'].includes(row.status))
    .reduce((sum, row) => sum + Number(row.payload?.appliedDays ?? 0), 0)
  const availableBalance = Math.max(0, entitlement - approvedUsed)
  if (appliedDays > availableBalance) {
    throw new AppError(`Insufficient leave balance. Available: ${availableBalance} day(s).`, 422, 'INSUFFICIENT_BALANCE')
  }

  const halfDay = String(req.body?.isHalfDayLeave ?? '0')
  const dates = calculateLeaveDates(appliedDays, startDate, halfDay)
  const payload = {
    ...req.body,
    leaveType: leaveType.code,
    leaveTypeDescription: leaveType.description,
    appliedDays,
    startDate,
    endDate: dates.endDate,
    returnDate: dates.returnDate,
    reason,
  }

  const row = await createRequest({
    requestType: 'leave',
    title: `${leaveType.description} — ${appliedDays} day(s)`,
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
    payload,
    attachments: [],
  })
  res.status(201).json({ ok: true, message: 'Leave application submitted successfully.', request: row })
}))

router.post('/leave/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  const no = String(req.body?.no ?? '')
  const row = (await getRequestByNo(no)) ?? (await getRequestById(no))
  if (!row) throw new AppError('Leave request was not found', 404)
  const user = await currentUser(req)
  if (row.makerEmployeeNo !== user.employeeNo) throw new AppError('Only the maker can cancel this leave request', 403)
  if (!['Draft', 'Pending Approval'].includes(row.status)) throw new AppError('Only draft or pending leave requests can be cancelled', 422)
  await updateRequestStatus(row.id, {
    status: 'Cancelled',
    actorEmployeeNo: user.employeeNo,
    actorName: displayName(user),
    role: 'Maker',
  })
  res.json({ ok: true, message: 'Leave request cancelled.' })
}))

router.get('/leave/statement', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  const leaveTypeCode = String(req.query.leaveType ?? '')
  if (!leaveTypeCode) throw new AppError('Leave type is required', 422)
  const leaveType = findLeaveType(leaveTypeCode)
  const rows = (await listRequests({ module: 'leave', employeeNo: user.employeeNo }))
    .filter((row) => row.payload?.leaveType === leaveTypeCode)
  const used = rows
    .filter((row) => ['Approved', 'Posted'].includes(row.status))
    .reduce((sum, row) => sum + Number(row.payload?.appliedDays ?? 0), 0)
  const { entitlement } = leaveEntitlement(user, leaveTypeCode)
  const pdf = createTextPdf('Leave Statement', [
    `Employee: ${user.employeeNo} - ${displayName(user)}`,
    `Leave type: ${leaveType?.description ?? leaveTypeCode}`,
    `Entitlement: ${entitlement}`,
    `Used: ${used}`,
    `Balance: ${Math.max(0, entitlement - used)}`,
    '',
    'Application No | Start Date | End Date | Days | Status',
    ...rows.map((row) =>
      [
        row.requestNo,
        payloadText(row.payload, 'startDate'),
        payloadText(row.payload, 'endDate'),
        payloadText(row.payload, 'appliedDays', '0'),
        row.status,
      ].join(' | '),
    ),
  ])
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFileName(user.employeeNo)}_leave.pdf"`,
  )
  res.send(pdf)
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
  const leaveRequests = await listRequests({ module: 'leave' })
  const usedByEmployeeAndType = new Map<string, number>()

  for (const request of leaveRequests) {
    if (request.status !== 'Approved') continue
    const employeeNo = request.makerEmployeeNo
    const leaveType = String(request.payload?.leaveType ?? 'ANNUAL')
    const appliedDays = Number(request.payload?.appliedDays ?? 0)
    const key = `${employeeNo}:${leaveType}`
    usedByEmployeeAndType.set(key, (usedByEmployeeAndType.get(key) ?? 0) + appliedDays)
  }

  res.json(
    users.map((row) => ({
      employeeNo: row.employeeNo,
      name: `${row.name} ${row.lastName}`.trim(),
      department: row.departmentName,
      leaveTypes: leaveTypes.map((leaveType) => ({
        code: leaveType.code,
        label: leaveType.description,
        balance:
          leaveType.code === 'ANNUAL'
            ? annualLeaveEntitlement(row, leaveType.days)
            : leaveType.days,
        used: usedByEmployeeAndType.get(`${row.employeeNo}:${leaveType.code}`) ?? 0,
      })),
    })),
  )
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
  currentEmployeeNo(req)
  res.json({ rows: [] })
}))

router.get('/work-tickets/:ticketNo', (_req, _res, next) => {
  next(new AppError('Work tickets are sourced from Business Central', 404, 'WORK_TICKET_NOT_FOUND'))
})

router.delete('/work-tickets/:ticketNo/lines/:lineNo', (_req, _res, next) => {
  next(new AppError('Work-ticket line deletion is only available in Business Central', 501, 'BC_ONLY'))
})

router.get('/hod/team-requests', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!user.HOD && !user.roles?.includes('hod')) throw new AppError('HOD access is required', 403)
  const departments = scopedDepartments(user)
  const rows = (await listUsers()).filter(
    (row) =>
      row.employeeNo !== user.employeeNo &&
      row.status === 'Active' &&
      departments.has(row.department),
  )
  res.json({
    rows: rows.map((row) => ({
      id: row.employeeNo,
      employee: `${row.name} ${row.lastName}`.trim(),
      employeeNo: row.employeeNo,
      requestType: row.jobTitle,
      requestNo: row.employeeNo,
      title: row.departmentName,
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

router.get('/payroll/periods', asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await listPayrollSlips({ employeeNo: currentEmployeeNo(req) })
  const periods = [...new Map(
    rows.map((row) => [`${row.year}-${row.month}`, { year: row.year, month: row.month }]),
  ).values()]
  res.json({ rows: periods })
}))

router.get('/payroll/payslip/pdf', asyncHandler(async (req: AuthedRequest, res) => {
  const year = Number(req.query.year)
  const month = typeof req.query.month === 'string' ? req.query.month : ''
  if (!year || !month) throw new AppError('Payroll year and month are required', 422)
  const row = await getPayrollSlip({ employeeNo: currentEmployeeNo(req), year, month })
  if (!row) throw new AppError('Payslip was not found for the selected period', 404, 'PAYSLIP_NOT_FOUND')
  const pdf = createTextPdf(`Payslip - ${row.month} ${row.year}`, [
    `Employee: ${row.employeeNo} - ${row.employeeName}`,
    `Department: ${row.departmentName || row.departmentCode}`,
    '',
    ...row.lines.map((line) => `${line.label}: ${Number(line.amount).toFixed(2)}`),
    '',
    `Gross Pay: ${row.grossPay.toFixed(2)}`,
    `Total Deductions: ${row.totalDeductions.toFixed(2)}`,
    `Net Pay: ${row.netPay.toFixed(2)}`,
  ])
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFileName(row.employeeNo)}_ps.pdf"`,
  )
  res.send(pdf)
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

router.get('/payroll/master-roll/pdf', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await currentUser(req)
  if (!user.CEO && !user.roles?.includes('ceo')) throw new AppError('CEO access is required', 403)
  const year = Number(req.query.year)
  const month = typeof req.query.month === 'string' ? req.query.month : ''
  const postingGroup = typeof req.query.postingGroup === 'string' ? req.query.postingGroup : ''
  if (!year || !month) throw new AppError('Payroll year and month are required', 422)
  const rows = await listPayrollSlips({ year, month })
  const pdf = createTextPdf(`Payroll Master Roll - ${month} ${year}`, [
    postingGroup ? `Posting Group: ${postingGroup}` : 'Posting Group: All',
    '',
    ...rows.map((row) =>
      [
        row.employeeNo,
        row.employeeName,
        row.departmentName || row.departmentCode,
        row.grossPay.toFixed(2),
        row.totalDeductions.toFixed(2),
        row.netPay.toFixed(2),
      ].join(' | '),
    ),
  ])
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${year}-${month}_masterroll.pdf"`)
  res.send(pdf)
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
  const content = doc.content ?? ''
  const bytes =
    doc.mimeType === 'application/pdf' && /^[A-Za-z0-9+/=\r\n]+$/.test(content)
      ? Buffer.from(content, 'base64')
      : Buffer.from(content)
  res.send(bytes)
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
