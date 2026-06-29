import { randomUUID } from 'node:crypto'
import { getPrisma } from './client.js'

const modulePrefixes = {
  imprest: 'IMP',
  imprestSurrender: 'IMS',
  staffClaim: 'SC',
  pettyCash: 'PC',
  pettyCashReplenishment: 'PCR',
  storeRequisition: 'SR',
  purchaseRequisition: 'PR',
  fuelRequest: 'FR',
  transport: 'TR',
  maintenance: 'MR',
  transferOrder: 'TO',
  vehicleTransfer: 'VT',
  gatePass: 'GP',
  leave: 'LV',
  overtime: 'OT',
  travel: 'TV',
  salaryAdvance: 'SA',
  training: 'TN',
  documentRequisition: 'DR',
}

function safeJson(value, fallback) {
  return value === undefined || value === null ? fallback : value
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value
}

function toAttachment(row) {
  return {
    id: row.id,
    fileName: row.fileName,
    fileType: row.mimeType,
    mimeType: row.mimeType,
    size: row.size,
    description: row.description,
    uploadedAt: iso(row.createdAt),
    progress: 100,
  }
}

function toPortalRequest(row) {
  return {
    id: row.id,
    requestNo: row.requestNo,
    requestType: row.requestType,
    title: row.title,
    status: row.status,
    makerEmployeeNo: row.makerEmployeeNo,
    makerName: row.makerName,
    departmentCode: row.departmentCode,
    departmentName: row.departmentName,
    responsibleCenter: row.responsibleCenter,
    amount: row.amount,
    sourceDocument: {
      documentNo: row.sourceDocumentNo,
      erpEntity: row.sourceDocumentEntity,
    },
    createdAt: iso(row.createdAt),
    submittedAt: row.submittedAt ? iso(row.submittedAt) : undefined,
    approverEmployeeNo: row.approverEmployeeNo ?? undefined,
    approverName: row.approverName ?? undefined,
    attachments: Array.isArray(row.files)
      ? row.files.map(toAttachment)
      : row.attachments ?? [],
    approvalSteps: row.approvalSteps ?? [],
    auditTrail: row.auditTrail ?? [],
    payload: row.payload ?? {},
  }
}

async function nextRequestNo(module) {
  const prefix = modulePrefixes[module] ?? module.slice(0, 3).toUpperCase()
  const year = new Date().getFullYear()
  const count = await getPrisma().portalRequest.count({ where: { requestType: module } })
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`
}

export async function listRequests({ module, employeeNo } = {}) {
  const rows = await getPrisma().portalRequest.findMany({
    where: {
      ...(module ? { requestType: module } : {}),
      ...(employeeNo ? { makerEmployeeNo: employeeNo } : {}),
    },
    include: { files: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toPortalRequest)
}

export async function listApprovalRequests({ employeeNo, type = 'pending' } = {}) {
  const status =
    type === 'approved'
      ? { in: ['Approved', 'Posted'] }
      : type === 'rejected'
        ? 'Rejected'
        : 'Pending Approval'

  const rows = await getPrisma().portalRequest.findMany({
    where: {
      status,
      ...(employeeNo ? { approverEmployeeNo: employeeNo } : {}),
    },
    include: { files: { orderBy: { createdAt: 'asc' } } },
    orderBy: { submittedAt: 'desc' },
  })
  return rows.map(toPortalRequest)
}

export async function getRequestById(id) {
  const row = await getPrisma().portalRequest.findUnique({
    where: { id },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  return row ? toPortalRequest(row) : null
}

export async function getRequestByNo(requestNo) {
  const row = await getPrisma().portalRequest.findUnique({
    where: { requestNo },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  return row ? toPortalRequest(row) : null
}

export async function createRequest(input) {
  const requestNo = await nextRequestNo(input.requestType)
  const now = new Date()
  const submittedAt = input.status === 'Pending Approval' ? now : null
  const sourceDocumentNo = input.sourceDocumentNo ?? requestNo
  const auditTrail = [
    {
      id: `audit-${randomUUID()}`,
      actorEmployeeNo: input.makerEmployeeNo,
      actorName: input.makerName,
      action: input.status === 'Draft' ? 'Saved draft' : 'Submitted for approval',
      timestamp: now.toISOString(),
    },
  ]
  const approvalSteps = [
    {
      id: `step-${randomUUID()}`,
      actorEmployeeNo: input.makerEmployeeNo,
      actorName: input.makerName,
      role: 'Maker',
      status: input.status === 'Draft' ? 'Draft' : 'Submitted',
      timestamp: now.toISOString(),
    },
    {
      id: `step-${randomUUID()}`,
      actorEmployeeNo: input.approverEmployeeNo,
      actorName: input.approverName,
      role: 'Checker',
      status: input.status,
      timestamp: now.toISOString(),
    },
  ]

  const attachments = Array.isArray(input.attachments) ? input.attachments : []
  const row = await getPrisma().portalRequest.create({
    data: {
      requestNo,
      requestType: input.requestType,
      title: input.title,
      status: input.status,
      makerEmployeeNo: input.makerEmployeeNo,
      makerName: input.makerName,
      departmentCode: input.departmentCode ?? '',
      departmentName: input.departmentName ?? '',
      responsibleCenter: input.responsibleCenter ?? '',
      amount: Number(input.amount ?? 0),
      sourceDocumentNo,
      sourceDocumentEntity: input.sourceDocumentEntity ?? input.requestType,
      submittedAt,
      approverEmployeeNo: input.approverEmployeeNo,
      approverName: input.approverName,
      payload: safeJson(input.payload, {}),
      attachments: [],
      approvalSteps,
      auditTrail,
      files: attachments.length
        ? {
            create: attachments.map((attachment) => ({
              scope: 'request',
              ownerKey: requestNo,
              documentNo: requestNo,
              tableId: Number(attachment.tableId ?? 0),
              fileName: String(attachment.fileName ?? 'attachment'),
              mimeType: String(
                attachment.fileType ??
                  attachment.mimeType ??
                  'application/octet-stream',
              ),
              size: Number(attachment.size ?? 0),
              description: String(
                attachment.description ?? attachment.fileName ?? 'Attachment',
              ),
              contentBase64: String(attachment.contentBase64 ?? ''),
              uploadedBy: input.makerEmployeeNo,
            })),
          }
        : undefined,
    },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })

  return toPortalRequest(row)
}

function recomputeAmount(payload) {
  const lines = Array.isArray(payload?.lines) ? payload.lines : []
  if (!lines.length) return undefined
  return lines.reduce(
    (sum, line) => sum + Number(line?.amount ?? line?.Amount ?? 0),
    0,
  )
}

async function mutateRequest(id, mutate, { recompute = true } = {}) {
  const existing = await getPrisma().portalRequest.findUnique({ where: { id } })
  if (!existing) return null
  const payload = { ...(existing.payload ?? {}) }
  mutate(payload)
  const data = { payload }
  if (recompute) {
    const amount = recomputeAmount(payload)
    if (amount !== undefined) data.amount = amount
  }
  const row = await getPrisma().portalRequest.update({
    where: { id },
    data,
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  return toPortalRequest(row)
}

/** Append a line to a request's payload.lines, assigning id + lineNo. */
export async function addRequestLine(id, line) {
  return mutateRequest(id, (payload) => {
    const lines = Array.isArray(payload.lines) ? [...payload.lines] : []
    const nextLineNo = lines.reduce((max, row) => Math.max(max, Number(row?.lineNo ?? 0)), 0) + 10000
    lines.push({ id: randomUUID(), lineNo: nextLineNo, ...line })
    payload.lines = lines
  })
}

/** Patch a single line identified by id or lineNo. */
export async function updateRequestLine(id, lineId, patch) {
  return mutateRequest(id, (payload) => {
    const lines = Array.isArray(payload.lines) ? [...payload.lines] : []
    payload.lines = lines.map((row) =>
      String(row?.id ?? row?.lineNo) === String(lineId) ? { ...row, ...patch } : row,
    )
  })
}

/** Replace all lines (used by bulk save flows such as imprest surrender). */
export async function setRequestLines(id, lines) {
  return mutateRequest(id, (payload) => {
    payload.lines = (Array.isArray(lines) ? lines : []).map((row, index) => ({
      id: row?.id ?? randomUUID(),
      lineNo: Number(row?.lineNo ?? (index + 1) * 10000),
      ...row,
    }))
  })
}

export async function deleteRequestLine(id, lineId) {
  return mutateRequest(id, (payload) => {
    const lines = Array.isArray(payload.lines) ? payload.lines : []
    payload.lines = lines.filter((row) => String(row?.id ?? row?.lineNo) !== String(lineId))
  })
}

/** Update header payload fields after creation (ESS edit-header). */
export async function updateRequestHeader(id, patch) {
  return mutateRequest(id, (payload) => {
    Object.assign(payload, patch)
  })
}

export async function addRequestAttachment(id, attachment) {
  const existing = await getPrisma().portalRequest.findUnique({ where: { id } })
  if (!existing) return null
  await getPrisma().portalAttachment.create({
    data: {
      scope: 'request',
      ownerKey: existing.requestNo,
      requestId: existing.id,
      documentNo: existing.requestNo,
      tableId: Number(attachment.tableId ?? 0),
      fileName: String(attachment.fileName ?? 'attachment'),
      mimeType: String(attachment.fileType ?? attachment.mimeType ?? 'application/octet-stream'),
      size: Number(attachment.size ?? 0),
      description: String(attachment.description ?? attachment.fileName ?? 'Attachment'),
      contentBase64: String(attachment.contentBase64 ?? ''),
      uploadedBy: String(attachment.uploadedBy ?? existing.makerEmployeeNo),
    },
  })
  return getRequestById(id)
}

export async function deleteRequestAttachment(id, attachmentId) {
  const attachment = await getPrisma().portalAttachment.findUnique({ where: { id: attachmentId } })
  if (!attachment || attachment.requestId !== id) return null
  await getPrisma().portalAttachment.delete({ where: { id: attachmentId } })
  return getRequestById(id)
}

export async function updateRequestStatus(id, input) {
  const existing = await getPrisma().portalRequest.findUnique({ where: { id } })
  if (!existing) return null

  const now = new Date().toISOString()
  const auditTrail = [...(existing.auditTrail ?? [])]
  auditTrail.push({
    id: `audit-${randomUUID()}`,
    actorEmployeeNo: input.actorEmployeeNo,
    actorName: input.actorName,
    action: input.status,
    timestamp: now,
    comment: input.comment,
  })

  const approvalSteps = [...(existing.approvalSteps ?? [])]
  approvalSteps.push({
    id: `step-${randomUUID()}`,
    actorEmployeeNo: input.actorEmployeeNo,
    actorName: input.actorName,
    role: input.role ?? 'Checker',
    status: input.status,
    timestamp: now,
    note: input.comment,
  })

  const row = await getPrisma().portalRequest.update({
    where: { id },
    data: {
      status: input.status,
      submittedAt:
        input.status === 'Pending Approval' && !existing.submittedAt
          ? new Date()
          : existing.submittedAt,
      auditTrail,
      approvalSteps,
    },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  return toPortalRequest(row)
}

export async function deleteRequest(id) {
  await getPrisma().portalRequest.delete({ where: { id } })
}

export async function dashboardSummary(employeeNo) {
  const rows = await listRequests()
  const mine = rows.filter((row) => row.makerEmployeeNo === employeeNo)
  const countModule = (module) => mine.filter((row) => row.requestType === module).length
  return {
    pendingApprovals: rows.filter((row) => row.status === 'Pending Approval' && row.approverEmployeeNo === employeeNo).length,
    approvedDocuments: mine.filter((row) => ['Approved', 'Posted'].includes(row.status)).length,
    rejectedDocuments: mine.filter((row) => row.status === 'Rejected').length,
    leaveApplications: countModule('leave'),
    staffClaims: countModule('staffClaim'),
    imprestRequisitions: countModule('imprest'),
    imprestSurrenders: countModule('imprestSurrender'),
    purchaseRequisitions: countModule('purchaseRequisition'),
    storeRequisitions: countModule('storeRequisition'),
    leaveBalance: 0,
    openRequests: mine.filter((row) => ['Draft', 'Pending Approval'].includes(row.status)).length,
    unresolved: mine.filter((row) => ['Rejected', 'Cancelled'].includes(row.status)).length,
    recentActivity: mine.slice(0, 5),
  }
}

export async function getRequestAttachment(id) {
  const row = await getPrisma().portalAttachment.findUnique({
    where: { id },
    include: {
      request: {
        select: {
          id: true,
          requestNo: true,
          makerEmployeeNo: true,
          approverEmployeeNo: true,
        },
      },
    },
  })
  if (!row) return null
  return {
    ...toAttachment(row),
    scope: row.scope,
    ownerKey: row.ownerKey,
    documentNo: row.documentNo,
    tableId: row.tableId,
    contentBase64: row.contentBase64,
    uploadedBy: row.uploadedBy,
    request: row.request,
  }
}

export async function listProfileAttachments(employeeNo) {
  const rows = await getPrisma().portalAttachment.findMany({
    where: { scope: 'profile', ownerKey: employeeNo },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toAttachment)
}

export async function createProfileAttachment(input) {
  const row = await getPrisma().portalAttachment.create({
    data: {
      scope: 'profile',
      ownerKey: input.employeeNo,
      documentNo: input.employeeNo,
      tableId: Number(input.tableId ?? 0),
      fileName: input.fileName,
      mimeType: input.mimeType ?? 'application/octet-stream',
      size: Number(input.size ?? 0),
      description: input.description ?? input.fileName,
      contentBase64: input.contentBase64,
      uploadedBy: input.uploadedBy ?? input.employeeNo,
    },
  })
  return toAttachment(row)
}
