import { formatISO } from 'date-fns'
import { departments } from '@/data/departments'
import { itemMaster } from '@/data/items'
import { moduleLabels } from '@/data/moduleLabels'
import type { ApprovalListType } from '@/types/approval'
import type {
  ApprovalQueueItem,
  Employee,
  PortalModuleKey,
  PortalRequest,
  RequestStatus,
} from '@/types/erp.types'

/**
 * In-memory fake backend used when `VITE_USE_MOCK=true`.
 *
 * Mirrors the shape and side-effects of the Laravel ESS API so the React app
 * can run end-to-end without the real backend during development.
 */

type Payload = Record<string, unknown>

const now = () => new Date()
const today = () => formatISO(now(), { representation: 'date' })
const timestamp = () => formatISO(now())
const delay = <T>(value: T, ms = 350) => new Promise<T>((resolve) => window.setTimeout(() => resolve(value), ms))

export const currentEmployee: Employee = {
  id: 'emp-03245',
  employeeNo: 'EMP-03245',
  displayName: 'Staff User',
  email: 'staff@example.com',
  departmentCode: 'FAC',
  departmentName: 'Facility Management',
  branchCode: 'HO',
  branchName: 'Head Office',
  jobTitle: 'Facility Officer',
  jobGrade: 'G5',
  placeOfDuty: 'Head Office',
  accountNumber: '1000459924',
  managerEmployeeNo: 'EMP-01002',
  leaveBalance: 12,
  responsibleCenter: 'HO-FAC',
  permissionDepartments: ['FAC'],
  gender: 'Male',
  phoneNumber: '0911000003',
  roles: ['staff'],
  isCEO: false,
  isHOD: false,
}

const checker = {
  employeeNo: 'EMP-01002',
  name: 'Approver',
}

let sequence = 24

function nextRequestNo(module: PortalModuleKey) {
  sequence += 1
  const prefix = moduleLabels[module]
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`
}

function statusFromSubmit(submit?: unknown): RequestStatus {
  return submit === false ? 'Draft' : 'Pending Approval'
}

function buildRequest(
  module: PortalModuleKey,
  opts: {
    status: RequestStatus
    maker?: Employee
    approver?: { employeeNo: string; name: string }
    amount?: number
    title?: string
    daysAgo?: number
    payload?: Payload
  },
): PortalRequest {
  const maker = opts.maker ?? currentEmployee
  const approver = opts.approver ?? checker
  const created = formatISO(new Date(Date.now() - (opts.daysAgo ?? 0) * 86_400_000))
  const requestNo = nextRequestNo(module)
  return {
    id: `req-${crypto.randomUUID()}`,
    requestNo,
    requestType: module,
    title: opts.title ?? moduleLabels[module],
    status: opts.status,
    makerEmployeeNo: maker.employeeNo,
    makerName: maker.displayName,
    departmentCode: maker.departmentCode,
    departmentName: maker.departmentName,
    responsibleCenter: maker.responsibleCenter,
    amount: opts.amount ?? 0,
    sourceDocument: { documentNo: requestNo, erpEntity: moduleLabels[module] },
    createdAt: created,
    submittedAt: opts.status !== 'Draft' ? created : undefined,
    approverEmployeeNo: approver.employeeNo,
    approverName: approver.name,
    attachments: [],
    approvalSteps: [
      {
        id: `step-${crypto.randomUUID()}`,
        actorEmployeeNo: maker.employeeNo,
        actorName: maker.displayName,
        role: 'Maker',
        status: opts.status === 'Draft' ? 'Draft' : 'Submitted',
        timestamp: created,
      },
      {
        id: `step-${crypto.randomUUID()}`,
        actorEmployeeNo: approver.employeeNo,
        actorName: approver.name,
        role: 'Checker',
        status: opts.status,
        timestamp: created,
      },
    ],
    auditTrail: [
      {
        id: `audit-${crypto.randomUUID()}`,
        actorEmployeeNo: maker.employeeNo,
        actorName: maker.displayName,
        action: opts.status === 'Draft' ? 'Saved draft' : 'Submitted for approval',
        timestamp: created,
      },
    ],
    payload: opts.payload ?? {},
  }
}

/** Demo seed so dashboard tiles and recent activity are populated on first load. */
let mockRequests: PortalRequest[] = [
  buildRequest('leave', { status: 'Pending Approval', title: 'Annual Leave — 3 days', amount: 0, daysAgo: 2 }),
  buildRequest('imprest', { status: 'Approved', title: 'Imprest for field visit', amount: 15000, daysAgo: 5 }),
  buildRequest('staffClaim', { status: 'Pending Approval', title: 'Medical claim — panel hospital', amount: 4200, daysAgo: 1 }),
  buildRequest('storeRequisition', { status: 'Rejected', title: 'Store items — stationery', amount: 0, daysAgo: 7 }),
  buildRequest('purchaseRequisition', {
    status: 'Pending Approval',
    title: 'Purchase — IT equipment',
    amount: 85000,
    daysAgo: 1,
    maker: {
      ...currentEmployee,
      employeeNo: 'EMP-03245',
      displayName: 'Staff Member',
      departmentCode: 'FAC',
      departmentName: 'Facility Management',
    } as Employee,
    approver: { employeeNo: currentEmployee.employeeNo, name: currentEmployee.displayName },
  }),
  buildRequest('imprestSurrender', { status: 'Approved', title: 'Surrender IMP-2026-00025', amount: 12000, daysAgo: 4 }),
  buildRequest('transport', { status: 'Pending Approval', title: 'City transport — client meeting', amount: 0, daysAgo: 0 }),
]

export async function mockListRequests(module?: PortalModuleKey) {
  const rows = module ? mockRequests.filter((request) => request.requestType === module) : mockRequests
  return delay([...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function mockGetRequest(id: string) {
  const request = mockRequests.find((item) => item.id === id)
  if (!request) throw new Error('Request was not found')
  return delay(request)
}

export async function mockCreateRequest(module: PortalModuleKey, payload: Payload) {
  const amount = Number(payload.amount ?? payload.grossAmount ?? payload.estimatedExpense ?? 0)
  const status = statusFromSubmit(payload.submit)
  const request: PortalRequest = {
    id: `req-${crypto.randomUUID()}`,
    requestNo: nextRequestNo(module),
    requestType: module,
    title: String(payload.title ?? moduleLabels[module]),
    status,
    makerEmployeeNo: currentEmployee.employeeNo,
    makerName: currentEmployee.displayName,
    departmentCode: String(payload.departmentCode ?? currentEmployee.departmentCode),
    departmentName: departments.find((department) => department.code === payload.departmentCode)?.name ?? currentEmployee.departmentName,
    responsibleCenter: String(payload.responsibleCenter ?? currentEmployee.responsibleCenter),
    amount,
    sourceDocument: { documentNo: nextRequestNo(module), erpEntity: moduleLabels[module] },
    createdAt: timestamp(),
    submittedAt: status === 'Pending Approval' ? timestamp() : undefined,
    approverEmployeeNo: checker.employeeNo,
    approverName: checker.name,
    attachments: [],
    approvalSteps: [
      {
        id: `step-${crypto.randomUUID()}`,
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        role: 'Maker',
        status: status === 'Draft' ? 'Draft' : 'Submitted',
        timestamp: timestamp(),
      },
      {
        id: `step-${crypto.randomUUID()}`,
        actorEmployeeNo: checker.employeeNo,
        actorName: checker.name,
        role: 'Checker',
        status,
        timestamp: timestamp(),
      },
    ],
    auditTrail: [
      {
        id: `audit-${crypto.randomUUID()}`,
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        action: status === 'Draft' ? 'Saved draft' : 'Submitted for approval',
        timestamp: timestamp(),
      },
    ],
    payload,
  }

  mockRequests = [request, ...mockRequests]
  return delay(request)
}

export async function mockCancelRequest(id: string) {
  const request = mockRequests.find((item) => item.id === id)
  if (!request) throw new Error('Request was not found')
  if (request.makerEmployeeNo !== currentEmployee.employeeNo) {
    throw new Error('Only the maker can cancel this request')
  }
  if (!['Draft', 'Pending Approval'].includes(request.status)) {
    throw new Error('Only draft or pending requests can be cancelled')
  }
  request.status = 'Cancelled'
  request.auditTrail.push({
    id: `audit-${crypto.randomUUID()}`,
    actorEmployeeNo: currentEmployee.employeeNo,
    actorName: currentEmployee.displayName,
    action: 'Cancelled',
    timestamp: timestamp(),
  })
  return delay(request)
}

export async function mockDeleteRequest(id: string) {
  const request = mockRequests.find((item) => item.id === id)
  if (!request) throw new Error('Request was not found')
  if (request.makerEmployeeNo !== currentEmployee.employeeNo) {
    throw new Error('Only the maker can delete this request')
  }
  if (request.status !== 'Draft') {
    throw new Error('Only draft requests can be deleted')
  }
  mockRequests = mockRequests.filter((item) => item.id !== id)
  return delay({ ok: true })
}

export async function mockListApprovals(
  type: ApprovalListType = 'pending',
  employeeNo = currentEmployee.employeeNo,
) {
  const rows: ApprovalQueueItem[] = mockRequests
    .filter((request) => {
      if (request.approverEmployeeNo !== employeeNo) return false
      if (type === 'pending') return request.status === 'Pending Approval'
      if (type === 'approved') return request.status === 'Approved' || request.status === 'Posted'
      return request.status === 'Rejected'
    })
    .map((request) => ({
      id: request.id,
      requestNo: request.requestNo,
      module: moduleLabels[request.requestType],
      title: request.title,
      makerEmployeeNo: request.makerEmployeeNo,
      makerName: request.makerName,
      amount: request.amount,
      status: request.status,
      submittedAt: request.submittedAt ?? request.createdAt,
      approverEmployeeNo: employeeNo,
      sourceDocumentNo: request.sourceDocument.documentNo,
    }))

  return delay(rows)
}

export async function mockDecideApproval(id: string, decision: 'Approved' | 'Rejected', comment: string) {
  const request = mockRequests.find((item) => item.id === id)
  if (!request) throw new Error('Approval item was not found')
  if (request.makerEmployeeNo === currentEmployee.employeeNo) {
    throw new Error('Maker cannot approve own request')
  }

  request.status = decision
  request.auditTrail.push({
    id: `audit-${crypto.randomUUID()}`,
    actorEmployeeNo: currentEmployee.employeeNo,
    actorName: currentEmployee.displayName,
    action: decision,
    timestamp: timestamp(),
    comment,
  })
  request.approvalSteps.push({
    id: `step-${crypto.randomUUID()}`,
    actorEmployeeNo: currentEmployee.employeeNo,
    actorName: currentEmployee.displayName,
    role: 'Checker',
    status: decision,
    timestamp: timestamp(),
    note: comment,
  })
  return delay(request)
}

export async function mockEmployee() {
  return delay(currentEmployee)
}

export async function mockDashboard() {
  const myEmpNo = currentEmployee.employeeNo
  const mine = (request: PortalRequest) => request.makerEmployeeNo === myEmpNo
  const countMine = (type: PortalModuleKey) =>
    mockRequests.filter((request) => request.requestType === type && mine(request)).length

  return delay({
    pendingApprovals: mockRequests.filter(
      (request) => request.status === 'Pending Approval' && request.approverEmployeeNo === myEmpNo,
    ).length,
    approvedDocuments: mockRequests.filter(
      (request) => mine(request) && (request.status === 'Approved' || request.status === 'Posted'),
    ).length,
    rejectedDocuments: mockRequests.filter((request) => mine(request) && request.status === 'Rejected').length,
    leaveApplications: countMine('leave'),
    staffClaims: countMine('staffClaim'),
    imprestRequisitions: countMine('imprest'),
    imprestSurrenders: countMine('imprestSurrender'),
    purchaseRequisitions: countMine('purchaseRequisition'),
    storeRequisitions: countMine('storeRequisition'),
    leaveBalance: currentEmployee.leaveBalance,
    openRequests: mockRequests.filter(
      (request) => mine(request) && ['Draft', 'Pending Approval'].includes(request.status),
    ).length,
    unresolved: mockRequests.filter(
      (request) => mine(request) && ['Rejected', 'Cancelled'].includes(request.status),
    ).length,
    recentActivity: [...mockRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
  })
}

export async function mockItems() {
  return delay([...itemMaster])
}

export async function mockReportRows(report: 'storeUsage' | 'leaveBalance' | 'gatePassLog') {
  const rows = {
    storeUsage: [
      { itemCode: 'ST032', description: 'Photocopy paper', issuedQty: 68, department: 'Branch Operations', month: 'May 2026' },
      { itemCode: 'ST067', description: 'Kyocera toner cartridge', issuedQty: 19, department: 'Facility Management', month: 'May 2026' },
    ],
    leaveBalance: [
      { employeeNo: currentEmployee.employeeNo, name: currentEmployee.displayName, annualBalance: 16, used: 5, department: currentEmployee.departmentName },
      { employeeNo: 'EMP-03245', name: 'Staff Member', annualBalance: 12, used: 9, department: 'Facility Management' },
    ],
    gatePassLog: [
      { gatePassNo: 'GP-000122', type: 'Returnable', assetTag: 'FA/BO/IT/FA112/0007/2026', destination: 'Branch Office', returnDate: today(), status: 'Pending Approval' },
      { gatePassNo: 'GP-000118', type: 'Non-Returnable', assetTag: 'FA/FAC/FF/FA220/0041/2026', destination: 'Warehouse', returnDate: '-', status: 'Approved' },
    ],
  }

  return delay(rows[report])
}
