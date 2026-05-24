import { addHours, formatISO } from 'date-fns'
import { departments, itemMaster, moduleLabels } from '@/utils/constants'
import type {
  ApprovalQueueItem,
  Employee,
  PortalModuleKey,
  PortalRequest,
  RequestStatus,
} from '@/types/erp.types'

type Payload = Record<string, unknown>

const now = () => new Date()
const today = () => formatISO(now(), { representation: 'date' })
const timestamp = () => formatISO(now())
const delay = <T>(value: T, ms = 350) => new Promise<T>((resolve) => window.setTimeout(() => resolve(value), ms))

export const currentEmployee: Employee = {
  id: 'emp-hb-02418',
  employeeNo: 'HB-02418',
  displayName: 'Beza Yoseff Abrehamm',
  email: 'amina.hassan.com',
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
}

const checker = {
  employeeNo: 'HB-01002',
  name: 'M. Tadesse',
}

let sequence = 24

let mockRequests: PortalRequest[] = [
  {
    id: 'req-001',
    requestNo: 'SSP-2026-0523-001',
    requestType: 'imprest',
    title: 'Client visit advance',
    status: 'Pending Approval',
    makerEmployeeNo: currentEmployee.employeeNo,
    makerName: currentEmployee.displayName,
    departmentCode: currentEmployee.departmentCode,
    departmentName: currentEmployee.departmentName,
    responsibleCenter: currentEmployee.responsibleCenter,
    amount: 18500,
    sourceDocument: { documentNo: 'ADV-000421', erpEntity: 'Staff Advance / Imprest' },
    createdAt: formatISO(addHours(now(), -7)),
    submittedAt: formatISO(addHours(now(), -6)),
    approverEmployeeNo: checker.employeeNo,
    approverName: checker.name,
    requisitionDate: today(),
    startDate: today(),
    returnDate: formatISO(addHours(now(), 72), { representation: 'date' }),
    durationDays: 3,
    placeOfDuty: currentEmployee.placeOfDuty,
    employeeAccountNumber: currentEmployee.accountNumber,
    jobGrade: currentEmployee.jobGrade,
    outstandingBalance: 18500,
    lines: [
      { id: 'line-1', expenseType: 'Per Diem', description: 'Field visit allowance', amount: 11000 },
      { id: 'line-2', expenseType: 'Transport', description: 'Local transport', amount: 7500 },
    ],
    attachments: [],
    approvalSteps: [
      {
        id: 'step-1',
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        role: 'Maker',
        status: 'Submitted',
        timestamp: formatISO(addHours(now(), -6)),
      },
      {
        id: 'step-2',
        actorEmployeeNo: checker.employeeNo,
        actorName: checker.name,
        role: 'Checker',
        status: 'Pending Approval',
        timestamp: timestamp(),
      },
    ],
    auditTrail: [
      {
        id: 'audit-1',
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        action: 'Submitted for approval',
        timestamp: formatISO(addHours(now(), -6)),
      },
    ],
  },
  {
    id: 'req-002',
    requestNo: 'SSP-2026-0523-002',
    requestType: 'storeRequisition',
    title: 'Printer toner replenishment',
    status: 'Pending Approval',
    makerEmployeeNo: 'HB-03245',
    makerName: 'Yonas Mekonnen',
    departmentCode: 'FAC',
    departmentName: 'Facility Management',
    responsibleCenter: 'HO-FAC',
    amount: 23400,
    sourceDocument: { documentNo: 'SR-000188', erpEntity: 'Store Requisition' },
    createdAt: formatISO(addHours(now(), -4)),
    submittedAt: formatISO(addHours(now(), -3)),
    approverEmployeeNo: currentEmployee.employeeNo,
    approverName: currentEmployee.displayName,
    lines: [
      {
        id: 'line-1',
        itemCode: 'ST067',
        description: 'Kyocera toner cartridge',
        quantity: 6,
        uom: 'Pcs',
        availableStock: 42,
        isFixedAsset: false,
      },
    ],
    budgetAvailable: 150000,
    attachments: [],
    approvalSteps: [
      {
        id: 'step-1',
        actorEmployeeNo: 'HB-03245',
        actorName: 'Yonas Mekonnen',
        role: 'Maker',
        status: 'Submitted',
        timestamp: formatISO(addHours(now(), -3)),
      },
      {
        id: 'step-2',
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        role: 'Checker',
        status: 'Pending Approval',
        timestamp: timestamp(),
      },
    ],
    auditTrail: [],
  },
  {
    id: 'req-003',
    requestNo: 'SSP-2026-0522-019',
    requestType: 'leave',
    title: 'Annual leave',
    status: 'Approved',
    makerEmployeeNo: currentEmployee.employeeNo,
    makerName: currentEmployee.displayName,
    departmentCode: currentEmployee.departmentCode,
    departmentName: currentEmployee.departmentName,
    responsibleCenter: currentEmployee.responsibleCenter,
    amount: 5,
    sourceDocument: { documentNo: 'LV-000315', erpEntity: 'Leave Management' },
    createdAt: formatISO(addHours(now(), -24)),
    submittedAt: formatISO(addHours(now(), -22)),
    approverEmployeeNo: checker.employeeNo,
    approverName: checker.name,
    leaveType: 'Annual',
    startDate: today(),
    endDate: formatISO(addHours(now(), 96), { representation: 'date' }),
    days: 5,
    balanceBefore: 16,
    payrollLinked: false,
    attachments: [],
    approvalSteps: [
      {
        id: 'step-1',
        actorEmployeeNo: currentEmployee.employeeNo,
        actorName: currentEmployee.displayName,
        role: 'Maker',
        status: 'Submitted',
        timestamp: formatISO(addHours(now(), -22)),
      },
      {
        id: 'step-2',
        actorEmployeeNo: checker.employeeNo,
        actorName: checker.name,
        role: 'Checker',
        status: 'Approved',
        timestamp: formatISO(addHours(now(), -18)),
      },
    ],
    auditTrail: [],
  },
]

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

export async function mockListApprovals(employeeNo = currentEmployee.employeeNo) {
  const rows: ApprovalQueueItem[] = mockRequests
    .filter((request) => request.status === 'Pending Approval' && request.approverEmployeeNo === employeeNo)
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
  return delay({
    pendingApprovals: mockRequests.filter(
      (request) => request.status === 'Pending Approval' && request.approverEmployeeNo === currentEmployee.employeeNo,
    ).length,
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
      { employeeNo: 'HB-03245', name: 'Yonas Mekonnen', annualBalance: 12, used: 9, department: 'Facility Management' },
    ],
    gatePassLog: [
      { gatePassNo: 'GP-000122', type: 'Returnable', assetTag: 'HB/BO/IT/FA112/0007/2026', destination: 'Bole Branch', returnDate: today(), status: 'Pending Approval' },
      { gatePassNo: 'GP-000118', type: 'Non-Returnable', assetTag: 'HB/FAC/FF/FA220/0041/2026', destination: 'Warehouse', returnDate: '-', status: 'Approved' },
    ],
  }

  return delay(rows[report])
}
