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
  id: 'emp-hb-02418',
  employeeNo: 'HB-02418',
  displayName: 'Demo User',
  email: '',
  departmentCode: 'BO',
  departmentName: 'Branch Operations',
  branchCode: 'HO',
  branchName: 'Head Office',
  jobTitle: 'Senior Operations Officer',
  jobGrade: 'G7',
  placeOfDuty: 'Head Office',
  accountNumber: '1000459922',
  managerEmployeeNo: 'HB-01002',
  leaveBalance: 16,
  responsibleCenter: 'HO-BO',
  permissionDepartments: ['BO'],
  isCEO: true,
  isHOD: true,
}

const checker = {
  employeeNo: 'HB-01002',
  name: 'Approver',
}

let sequence = 24

/**
 * No pre-seeded approvals — the queue and detail start empty. Requests created
 * through the app (mockCreateRequest) are appended here at runtime.
 */
let mockRequests: PortalRequest[] = []

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
  const isFor = (type: string) => (request: (typeof mockRequests)[number]) => request.requestType === type
  const myEmpNo = currentEmployee.employeeNo
  const totalApproved = mockRequests.filter((r) => r.status === 'Approved' || r.status === 'Posted').length
  const totalRejected = mockRequests.filter((r) => r.status === 'Rejected').length

  return delay({
    pendingApprovals: mockRequests.filter(
      (request) => request.status === 'Pending Approval' && request.approverEmployeeNo === myEmpNo,
    ).length,
    approvedDocuments: totalApproved,
    rejectedDocuments: totalRejected,
    leaveApplications: mockRequests.filter(isFor('leave')).length,
    staffClaims: mockRequests.filter(isFor('staffClaim')).length,
    imprestRequisitions: mockRequests.filter(isFor('imprest')).length,
    imprestSurrenders: mockRequests.filter(isFor('imprestSurrender')).length,
    purchaseRequisitions: mockRequests.filter(isFor('purchaseRequisition')).length,
    storeRequisitions: mockRequests.filter(isFor('storeRequisition')).length,
    /** kept for backwards compatibility with older callers */
    leaveBalance: currentEmployee.leaveBalance,
    openRequests: mockRequests.filter((request) => ['Draft', 'Pending Approval'].includes(request.status)).length,
    unresolved: mockRequests.filter((request) => ['Rejected', 'Cancelled'].includes(request.status)).length,
    recentActivity: mockRequests.slice(0, 5),
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
      { employeeNo: 'HB-03245', name: 'Staff Member', annualBalance: 12, used: 9, department: 'Facility Management' },
    ],
    gatePassLog: [
      { gatePassNo: 'GP-000122', type: 'Returnable', assetTag: 'HB/BO/IT/FA112/0007/2026', destination: 'Bole Branch', returnDate: today(), status: 'Pending Approval' },
      { gatePassNo: 'GP-000118', type: 'Non-Returnable', assetTag: 'HB/FAC/FF/FA220/0041/2026', destination: 'Warehouse', returnDate: '-', status: 'Approved' },
    ],
  }

  return delay(rows[report])
}
