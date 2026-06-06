import { createDocumentRequisition, listDocumentRequisitions } from '@/api/endpoints/documentRequisition'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { documentRequisitionSchema, type DocumentRequisitionForm } from '@/schemas/requestSchemas'

const documentTypeOptions = [
  { label: 'Guarantee Letter (External Company)', value: 'Guarantee Letter (External Company)' },
  { label: 'Experience Letter', value: 'Experience Letter' },
  { label: 'Letter for Mortgage', value: 'Letter for Mortgage' },
  { label: 'Emergency Staff Loan Letter', value: 'Emergency Staff Loan Letter' },
  { label: 'Employment Letter', value: 'Employment Letter' },
  { label: 'Salary Certificate', value: 'Salary Certificate' },
  { label: 'Service Certificate', value: 'Service Certificate' },
]

export function DocumentRequisition() {
  return (
    <RequestFormPage
      title="Document Requisition"
      description="Request HR service letters for external companies, mortgage, loans, and certificates."
      schema={documentRequisitionSchema}
      queryKey={['hr', 'document-requisition']}
      listRequests={listDocumentRequisitions}
      createRequest={(values) => createDocumentRequisition(values as DocumentRequisitionForm)}
      moduleConfig={{ module: 'documentRequisition', entity: 'selfServiceDocumentRequests' }}
      defaultValues={{ documentType: '', purpose: '' }}
      fields={[
        { name: 'documentType', label: 'Document type', type: 'select', options: documentTypeOptions },
        { name: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'State the purpose for this document request' },
      ]}
      businessRules={[
        'Purpose must clearly state why the letter is required.',
        'Request routes to HR for processing and approval.',
        'Processed documents are available for download once approved.',
      ]}
    />
  )
}
