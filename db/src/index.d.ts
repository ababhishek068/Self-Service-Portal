/**
 * Public type surface of the @ssp/db package.
 *
 * The backend depends only on these plain types — never on Prisma's generated
 * client — so the database engine stays an internal implementation detail.
 */

export type UserStatus = 'Active' | 'Inactive' | 'Blocked'

export interface DbUser {
  employeeNo: string
  name: string
  lastName: string
  roles: string[]
  email: string
  department: string
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
  phoneNumber: string
  gender: string
  passwordHash: string
  status: UserStatus
  HOD: boolean
  CEO: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

/** Fields accepted when creating/updating a user. */
export interface UpsertUserInput {
  employeeNo: string
  name: string
  lastName?: string
  roles?: string[]
  email?: string
  department?: string
  departmentName?: string
  branchCode?: string
  branchName?: string
  jobTitle?: string
  jobGrade?: string
  placeOfDuty?: string
  accountNumber?: string
  managerEmployeeNo?: string
  leaveBalance?: number
  responsibleCenter?: string
  permissionDepartments?: string[]
  phoneNumber?: string
  gender?: string
  passwordHash: string
  status?: UserStatus
  HOD?: boolean
  CEO?: boolean
  mustChangePassword?: boolean
}

export function findUserByStaffNo(employeeNo: string): Promise<DbUser | null>
export function listUsers(): Promise<DbUser[]>
export function listUsersByManager(managerEmployeeNo: string): Promise<DbUser[]>
export function upsertUser(input: UpsertUserInput): Promise<DbUser>
export function updatePassword(employeeNo: string, passwordHash: string): Promise<void>

export interface DbPortalRequest {
  id: string
  requestNo: string
  requestType: string
  title: string
  status: string
  makerEmployeeNo: string
  makerName: string
  departmentCode: string
  departmentName: string
  responsibleCenter: string
  amount: number
  sourceDocument: { documentNo: string; erpEntity: string }
  createdAt: string
  submittedAt?: string
  approverEmployeeNo?: string
  approverName?: string
  attachments: unknown[]
  approvalSteps: unknown[]
  auditTrail: unknown[]
  payload: Record<string, unknown>
}

export interface CreatePortalRequestInput {
  requestType: string
  title: string
  status: string
  makerEmployeeNo: string
  makerName: string
  departmentCode?: string
  departmentName?: string
  responsibleCenter?: string
  amount?: number
  sourceDocumentNo?: string
  sourceDocumentEntity?: string
  approverEmployeeNo?: string
  approverName?: string
  payload?: Record<string, unknown>
  attachments?: unknown[]
}

export interface DbAttachment {
  id: string
  fileName: string
  fileType: string
  mimeType: string
  size: number
  description: string
  uploadedAt: string
  progress: number
  contentBase64?: string
}

export function listRequests(input?: { module?: string; employeeNo?: string }): Promise<DbPortalRequest[]>
export function listApprovalRequests(input?: { employeeNo?: string; type?: string }): Promise<DbPortalRequest[]>
export function getRequestById(id: string): Promise<DbPortalRequest | null>
export function getRequestByNo(requestNo: string): Promise<DbPortalRequest | null>
export function createRequest(input: CreatePortalRequestInput): Promise<DbPortalRequest>
export function updateRequestStatus(
  id: string,
  input: { status: string; actorEmployeeNo: string; actorName: string; comment?: string; role?: string },
): Promise<DbPortalRequest | null>
export function updateRequestHeader(
  id: string,
  patch: Record<string, unknown>,
): Promise<DbPortalRequest | null>
export function addRequestLine(
  id: string,
  line: Record<string, unknown>,
): Promise<DbPortalRequest | null>
export function updateRequestLine(
  id: string,
  lineId: string,
  patch: Record<string, unknown>,
): Promise<DbPortalRequest | null>
export function setRequestLines(
  id: string,
  lines: Record<string, unknown>[],
): Promise<DbPortalRequest | null>
export function deleteRequestLine(id: string, lineId: string): Promise<DbPortalRequest | null>
export function addRequestAttachment(
  id: string,
  attachment: Record<string, unknown>,
): Promise<DbPortalRequest | null>
export function deleteRequestAttachment(
  id: string,
  attachmentId: string,
): Promise<DbPortalRequest | null>
export function deleteRequest(id: string): Promise<void>
export function dashboardSummary(employeeNo: string): Promise<Record<string, unknown>>
export function getRequestAttachment(id: string): Promise<
  | (DbAttachment & {
      scope: string
      ownerKey: string
      documentNo: string
      tableId: number
      contentBase64: string
      uploadedBy: string
      request?: {
        id: string
        requestNo: string
        makerEmployeeNo: string
        approverEmployeeNo?: string | null
      } | null
    })
  | null
>
export function listProfileAttachments(employeeNo: string): Promise<DbAttachment[]>
export function createProfileAttachment(input: {
  employeeNo: string
  fileName: string
  mimeType?: string
  size?: number
  description?: string
  contentBase64: string
  uploadedBy?: string
  tableId?: number
}): Promise<DbAttachment>

export interface DbAttendanceRecord {
  id: string
  date: string
  staffName: string
  employeeNo: string
  timeIn: string
  timeOut: string
  hoursWorked: string
  location: string
  comments: string
  departmentCode: string
  departmentName: string
  managerEmployeeNo: string
  createdAt: string
  updatedAt: string
}

export function listAttendance(input?: { employeeNo?: string; departmentCode?: string }): Promise<DbAttendanceRecord[]>
export function signInAttendance(input: {
  employeeNo: string
  staffName: string
  date: string
  timeIn: string
  location?: string
  comments?: string
  departmentCode?: string
  departmentName?: string
  managerEmployeeNo?: string
}): Promise<DbAttendanceRecord>
export function signOutAttendance(input: {
  employeeNo: string
  date: string
  timeOut: string
  hoursWorked?: string
}): Promise<DbAttendanceRecord | null>

export interface DbPayrollSlipLine {
  label: string
  amount: number
  type: 'earning' | 'deduction'
}

export interface DbPayrollSlip {
  id: string
  employeeNo: string
  employeeName: string
  departmentCode: string
  departmentName: string
  year: number
  month: string
  grossPay: number
  totalDeductions: number
  netPay: number
  lines: DbPayrollSlipLine[]
  generatedAt: string
  createdAt: string
  updatedAt: string
}

export function getPayrollSlip(input: { employeeNo: string; year: number | string; month: string }): Promise<DbPayrollSlip | null>
export function listPayrollSlips(input?: { year?: number | string; month?: string; employeeNo?: string }): Promise<DbPayrollSlip[]>
export function upsertPayrollSlip(input: {
  employeeNo: string
  employeeName: string
  departmentCode?: string
  departmentName?: string
  year: number | string
  month: string
  grossPay?: number
  totalDeductions?: number
  netPay?: number
  lines?: DbPayrollSlipLine[]
  generatedAt?: string
}): Promise<DbPayrollSlip>

export interface DbPolicyDocument {
  id: string
  title: string
  category: string
  updated: string
  fileName: string
  mimeType: string
  content?: string
  createdAt: string
  updatedAt: string
}

export function listPolicyDocuments(): Promise<DbPolicyDocument[]>
export function getPolicyDocument(id: string): Promise<DbPolicyDocument | null>
export function upsertPolicyDocument(input: {
  id: string
  title: string
  category: string
  updated?: string
  updatedOn?: string
  fileName: string
  mimeType?: string
  content: string
}): Promise<DbPolicyDocument>

export interface DbPerformanceReview {
  id: string
  employeeNo: string
  employeeName: string
  period: string
  supervisorEmployeeNo: string
  supervisorName: string
  departmentCode: string
  departmentName: string
  status: string
  createdAt: string
  updatedAt: string
}

export function listPerformanceReviews(input?: { employeeNo?: string; departmentCode?: string }): Promise<DbPerformanceReview[]>
export function upsertPerformanceReview(input: {
  employeeNo: string
  employeeName: string
  period: string
  supervisorEmployeeNo?: string
  supervisorName?: string
  departmentCode?: string
  departmentName?: string
  status?: string
}): Promise<DbPerformanceReview>

export interface DbEmployeeProfile {
  id: string
  employeeNo: string
  sector: string
  division: string
  district: string
  maritalStatus: string
  employmentType: string
  dateOfJoin: string
  contractStartDate: string
  contractEndDate: string
  probationEndDate: string
  nextOfKin: unknown[]
  employmentHistory: unknown[]
  qualifications: unknown[]
  assignedAssets: unknown[]
  createdAt: string
  updatedAt: string
}

export function getEmployeeProfile(employeeNo: string): Promise<DbEmployeeProfile | null>
export function upsertEmployeeProfile(input: {
  employeeNo: string
  sector?: string
  division?: string
  district?: string
  maritalStatus?: string
  employmentType?: string
  dateOfJoin?: string
  contractStartDate?: string
  contractEndDate?: string
  probationEndDate?: string
  nextOfKin?: unknown[]
  employmentHistory?: unknown[]
  qualifications?: unknown[]
  assignedAssets?: unknown[]
}): Promise<DbEmployeeProfile>

/**
 * Low-level escape hatch returning the underlying Prisma client. Typed as
 * `unknown` on purpose so consumers don't take a compile-time dependency on
 * Prisma's generated types — cast it where you genuinely need raw access.
 */
export function getPrisma(): unknown
export function disconnect(): Promise<void>
