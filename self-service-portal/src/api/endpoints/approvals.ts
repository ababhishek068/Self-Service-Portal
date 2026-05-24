import { env } from '@/config/env'
import { erpEntityPath, erpGet, erpPost } from '@/api/erpConnector'
import { mockDecideApproval, mockGetRequest, mockListApprovals } from './_mockStore'
import type { ApprovalQueueItem, PortalRequest, ODataCollection } from '@/types/erp.types'

export const listPendingApprovals = async () => {
  if (env.USE_MOCK) return mockListApprovals()
  const result = await erpGet<ODataCollection<ApprovalQueueItem>>(erpEntityPath('selfServiceApprovalEntries'), {
    $filter: "status eq 'Pending Approval'",
    $orderby: 'submittedAt desc',
  })
  return result.value
}

export const getApprovalDetail = async (id: string) => {
  if (env.USE_MOCK) return mockGetRequest(id)
  return erpGet<PortalRequest>(`${erpEntityPath('selfServiceApprovalEntries')}(${id})`, { $expand: 'approvalSteps,auditTrail' })
}

export const decideApproval = async (id: string, decision: 'Approved' | 'Rejected', comment: string) => {
  if (env.USE_MOCK) return mockDecideApproval(id, decision, comment)
  return erpPost<PortalRequest>(`${erpEntityPath('selfServiceApprovalEntries')}(${id})/Microsoft.NAV.${decision}`, {
    comment,
  })
}
