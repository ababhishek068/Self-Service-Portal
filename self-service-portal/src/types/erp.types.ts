import type { PortalRole } from '@/config/roles'

export const requestStatuses = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Cancelled',
  'Posted',
] as const

export type RequestStatus = (typeof requestStatuses)[number]

export type BadgeStatus =
  | RequestStatus
  | 'Pass'
  | 'Fail'
  | 'Pending'
  | 'Open'
  | 'Synced'
  | 'Error'

export interface BusinessCentralEntity {
  id: string
  systemId?: string
  number?: string
  etag?: string
  lastModifiedDateTime?: string
}

export interface Employee extends BusinessCentralEntity {
  employeeNo: string
  displayName: string
  email: string
  departmentCode: string
  departmentName: string
  branchCode: string
  branchName: string
  jobTitle: string
  jobGrade: string
  placeOfDuty: string
  accountNumber: string
  managerEmployeeNo: string
  leaveBalance: number
  responsibleCenter: string
  permissionDepartments: string[]
  gender?: string
  phoneNumber?: string
  /** Normalized RBAC roles resolved from the backend on login. */
  roles: PortalRole[]
  /** True when the employee can view the CEO function group (master roll, etc.) */
  isCEO?: boolean
  /** True when the employee leads a department (HOD function group). */
  isHOD?: boolean
  /** True when the employee can approve documents, including staff managers with direct reports. */
  canApprove?: boolean
}

export interface Attachment {
  id: string
  fileName: string
  fileType: string
  size: number
  progress: number
  uploadedAt: string
  description?: string
  contentBase64?: string
}

export interface ApprovalStep {
  id: string
  actorEmployeeNo: string
  actorName: string
  role: 'Maker' | 'Checker' | 'Finance' | 'Facility' | 'HR' | 'System'
  status: RequestStatus | 'Submitted'
  timestamp: string
  note?: string
  sequenceNo?: number
}

export interface AuditTrailEntry {
  id: string
  actorEmployeeNo: string
  actorName: string
  action: string
  timestamp: string
  comment?: string
}

export interface SourceDocument {
  documentNo: string
  externalDocumentNo?: string
  erpEntity: string
  erpId?: string
}

export interface BaseRequest extends BusinessCentralEntity {
  requestNo: string
  requestType: PortalModuleKey
  title: string
  status: RequestStatus
  makerEmployeeNo: string
  makerName: string
  departmentCode: string
  departmentName: string
  responsibleCenter: string
  amount: number
  sourceDocument: SourceDocument
  createdAt: string
  submittedAt?: string
  approverEmployeeNo?: string
  approverName?: string
  auditTrail: AuditTrailEntry[]
  approvalSteps: ApprovalStep[]
  attachments: Attachment[]
  /** Raw form payload retained for list filtering and ERP replay. */
  payload?: Record<string, unknown>
}

export interface ImprestLine {
  id: string
  expenseType: string
  description: string
  amount: number
}

export interface ImprestRequest extends BaseRequest {
  requestType: 'imprest'
  requisitionDate: string
  startDate: string
  returnDate: string
  durationDays: number
  placeOfDuty: string
  employeeAccountNumber: string
  jobGrade: string
  lines: ImprestLine[]
  outstandingBalance: number
}

export interface StaffClaimRequest extends BaseRequest {
  requestType: 'staffClaim'
  claimType: 'Per Diem & Accommodation' | 'Medical' | 'Other'
  hospitalCategory?: string
  coveragePercent?: number
  grossAmount: number
  netAmount: number
}

export interface PettyCashRequest extends BaseRequest {
  requestType: 'pettyCash'
  activity: 'Request' | 'Petty Cash Replenishment' | 'Petty Cash Settlement'
  limitAmount: number
  settlementAmount?: number
}

export interface StoreRequisitionLine {
  id: string
  itemCode: string
  description: string
  quantity: number
  uom: string
  availableStock: number
  isFixedAsset: boolean
  faTagNumber?: string
}

export interface StoreRequisition extends BaseRequest {
  requestType: 'storeRequisition'
  lines: StoreRequisitionLine[]
  budgetAvailable: number
}

export interface PurchaseRequisitionLine {
  id: string
  itemType: 'Item' | 'Service' | 'Fixed Asset'
  quantity: number
  uom: string
  description: string
  brand?: string
  standard?: string
  specification?: string
  stake?: string
  amount: number
}

export interface PurchaseRequisition extends BaseRequest {
  requestType: 'purchaseRequisition'
  lines: PurchaseRequisitionLine[]
  duplicateCheckedAt?: string
}

export interface GatePassRequest extends BaseRequest {
  requestType: 'gatePass'
  gatePassType: 'Returnable' | 'Non-Returnable'
  assetTagNumber?: string
  returnDate?: string
  destination: string
}

export interface LeaveRequest extends BaseRequest {
  requestType: 'leave'
  leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Leave Without Pay'
  startDate: string
  endDate: string
  days: number
  balanceBefore: number
  payrollLinked: boolean
  postponement?: {
    newStartDate: string
    newEndDate: string
    reason: string
  }
}

export interface GenericRequest extends BaseRequest {
  requestType: PortalModuleKey
  payload: Record<string, unknown>
}

export type PortalRequest =
  | ImprestRequest
  | StaffClaimRequest
  | PettyCashRequest
  | StoreRequisition
  | PurchaseRequisition
  | GatePassRequest
  | LeaveRequest
  | GenericRequest

export interface ApprovalQueueItem {
  id: string
  requestNo: string
  module: string
  title: string
  makerEmployeeNo: string
  makerName: string
  amount: number
  status: RequestStatus
  submittedAt: string
  approverEmployeeNo: string
  sourceDocumentNo: string
}

export interface ODataCollection<T> {
  '@odata.context'?: string
  value: T[]
}

export interface ODataError {
  code?: string
  message?: string
  details?: Array<{ code?: string; message?: string }>
}

export type PortalModuleKey =
  | 'imprest'
  | 'imprestSurrender'
  | 'staffClaim'
  | 'pettyCash'
  | 'pettyCashReplenishment'
  | 'storeRequisition'
  | 'purchaseRequisition'
  | 'fuelRequest'
  | 'transport'
  | 'maintenance'
  | 'transferOrder'
  | 'vehicleTransfer'
  | 'gatePass'
  | 'leave'
  | 'overtime'
  | 'travel'
  | 'salaryAdvance'
  | 'training'
  | 'documentRequisition'
