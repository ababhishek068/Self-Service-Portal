import { ApprovalsList } from './ApprovalsList'

export function PendingApprovals() {
  return (
    <ApprovalsList
      type="pending"
      title="Pending Approval"
      emptyTitle="*** No documents awaiting your approval ***"
    />
  )
}
