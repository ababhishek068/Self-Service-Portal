import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { decideApproval, getApprovalDetail, listPendingApprovals } from '@/api/endpoints/approvals'

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: listPendingApprovals,
  })
}

export function useApprovalDetail(id: string) {
  return useQuery({
    queryKey: ['approvals', id],
    queryFn: () => getApprovalDetail(id),
    enabled: Boolean(id),
  })
}

export function useApprovalDecision(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ decision, comment }: { decision: 'Approved' | 'Rejected'; comment: string }) =>
      decideApproval(id, decision, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
