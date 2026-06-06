import { authGet, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { ApprovalListType } from '@/types/approval'
import type { ApprovalQueueItem, PortalRequest } from '@/types/erp.types'

export const listApprovals = async (type: ApprovalListType = 'pending') => {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: ApprovalQueueItem[] }>('/api/approvals', { params: { type } })
  return rows
}

export const listPendingApprovals = () => listApprovals('pending')
export const listApprovedDocuments = () => listApprovals('approved')
export const listRejectedDocuments = () => listApprovals('rejected')

export const getApprovalDetail = async (id: string) => {
  requireAuthApiUrl()
  return authGet<PortalRequest>(`/api/requests/${encodeURIComponent(id)}`)
}

export const decideApproval = async (id: string, decision: 'Approved' | 'Rejected', comment: string) => {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/approvals/${encodeURIComponent(id)}/decide`, { decision, comment })
}

export const getApprovalsCount = async (type: string, status: string) => {
  requireAuthApiUrl()
  return authGet<{ totalAll: number; isNotified: boolean }>(
    `/api/approvals/count/${encodeURIComponent(type)}/${encodeURIComponent(status)}`,
  )
}
