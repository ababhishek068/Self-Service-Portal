import { ApprovalsList } from './ApprovalsList'

export function ApprovedDocuments() {
  return (
    <ApprovalsList
      type="approved"
      title="Approved Documents"
      emptyTitle="*** No approved documents found ***"
    />
  )
}
