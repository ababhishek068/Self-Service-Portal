import { randomUUID } from 'node:crypto'
import { getPrisma } from './client.js'

const modulePrefixes = {
  imprest: 'IMP',
  imprestSurrender: 'IMS',
  staffClaim: 'SC',
  pettyCash: 'PC',
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
    attachments: row.attachments ?? [],
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
    orderBy: { submittedAt: 'desc' },
  })
  return rows.map(toPortalRequest)
}

export async function getRequestById(id) {
  const row = await getPrisma().portalRequest.findUnique({ where: { id } })
  return row ? toPortalRequest(row) : null
}

export async function getRequestByNo(requestNo) {
  const row = await getPrisma().portalRequest.findUnique({ where: { requestNo } })
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
      attachments: safeJson(input.attachments, []),
      approvalSteps,
      auditTrail,
    },
  })

  return toPortalRequest(row)
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
      auditTrail,
      approvalSteps,
    },
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
