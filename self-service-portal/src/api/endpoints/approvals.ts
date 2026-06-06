import { env } from '@/config/env'
import { authGet, authPost } from '@/api/client/authClient'
import { essGet, essPost } from '@/api/client/essClient'
import { mockDecideApproval, mockGetRequest, mockListApprovals } from '@/api/mock/mockStore'
import type { ApprovalListType } from '@/types/approval'
import type { ApprovalQueueItem, PortalRequest, RequestStatus } from '@/types/erp.types'

/**
 * Map our internal list type to the Status string Business Central uses.
 * Mirrors the buckets in App\Http\Controllers\Staff\ApprovalsController.
 */
const statusFor = (type: ApprovalListType): 'Open' | 'Approved' | 'Rejected' => {
  if (type === 'approved') return 'Approved'
  if (type === 'rejected') return 'Rejected'
  return 'Open'
}

/** Raw row returned by `/api/staff/approvals` — comes straight from BC's ApprovalEntry. */
interface BcApprovalRow {
  DocumentNo: string
  DocumentType: string
  TableID: number
  ApproverID: string
  SenderID: string
  SenderName?: string
  Amount?: number
  CurrencyCode?: string
  Status: string
  DueDate?: string
  DateTimeSentforApproval?: string
}

function toQueueItem(row: BcApprovalRow): ApprovalQueueItem {
  return {
    id: row.DocumentNo,
    requestNo: row.DocumentNo,
    module: row.DocumentType,
    title: row.DocumentType,
    makerEmployeeNo: row.SenderID,
    makerName: row.SenderName ?? row.SenderID,
    amount: row.Amount ?? 0,
    status: (row.Status as RequestStatus) ?? 'Pending Approval',
    submittedAt: row.DateTimeSentforApproval ?? row.DueDate ?? '',
    approverEmployeeNo: row.ApproverID,
    sourceDocumentNo: row.DocumentNo,
  }
}

export const listApprovals = async (type: ApprovalListType = 'pending') => {
  if (env.USE_MOCK) return mockListApprovals(type)
  if (env.AUTH_API_URL) {
    const { rows } = await authGet<{ rows: ApprovalQueueItem[] }>('/api/approvals', { params: { type } })
    return rows
  }
  const { rows } = await essGet<{ rows: BcApprovalRow[] }>('/api/staff/approvals', {
    params: { status: statusFor(type) },
  })
  return rows.map(toQueueItem)
}

export const listPendingApprovals = () => listApprovals('pending')
export const listApprovedDocuments = () => listApprovals('approved')
export const listRejectedDocuments = () => listApprovals('rejected')

export const getApprovalDetail = async (id: string) => {
  if (env.USE_MOCK) return mockGetRequest(id)
  if (env.AUTH_API_URL) return authGet<PortalRequest>(`/api/requests/${encodeURIComponent(id)}`)
  return essGet<PortalRequest>(`/api/staff/approvals/${encodeURIComponent(id)}`)
}

export const decideApproval = async (id: string, decision: 'Approved' | 'Rejected', comment: string) => {
  if (env.USE_MOCK) return mockDecideApproval(id, decision, comment)
  if (env.AUTH_API_URL) {
    return authPost<PortalRequest>(`/api/approvals/${encodeURIComponent(id)}/decide`, { decision, comment })
  }
  return essPost<PortalRequest>('/api/staff/approvals/decide', {
    docNo: id,
    decision,
    comment,
  })
}

export const getApprovalsCount = async (type: string, status: string) => {
  if (env.USE_MOCK) {
    const rows = await mockListApprovals('pending')
    return { totalAll: rows.length, isNotified: false }
  }
  if (env.AUTH_API_URL) {
    return authGet<{ totalAll: number; isNotified: boolean }>(
      `/api/approvals/count/${encodeURIComponent(type)}/${encodeURIComponent(status)}`,
    )
  }
  return essGet<{ totalAll: number; isNotified: boolean }>(
    `/api/staff/approvals/count/${encodeURIComponent(type)}/${encodeURIComponent(status)}`,
  )
}
