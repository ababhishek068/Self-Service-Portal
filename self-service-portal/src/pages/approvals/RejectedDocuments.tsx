import { ApprovalsList } from './ApprovalsList'

export function RejectedDocuments() {
  return (
    <ApprovalsList
      type="rejected"
      title="Rejected Documents"
      emptyTitle="*** No rejected documents found ***"
    />
  )
}
