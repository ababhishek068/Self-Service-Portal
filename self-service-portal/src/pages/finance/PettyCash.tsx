import { formatISO } from 'date-fns'
import { MultiStepRequestPage } from '@/components/shared/MultiStepRequestPage'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { pettyCashTypeOptions } from '@/data/essOptions'
import { pettyCashHeaderSchema, pettyCashLineSchema } from '@/schemas/requestSchemas'
import { formatCurrency } from '@/utils/formatters'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })
const module = { module: 'pettyCash', entity: 'selfServicePettyCashRequests' } as const

export function PettyCash() {
  const paymentTypes = useLookupOptions('petty-cash-types', pettyCashTypeOptions)

  return (
    <MultiStepRequestPage
      title="Petty Cash Request"
      headerLabel="New Petty Cash Requisition"
      description="Create a petty cash requisition header, then add requisition lines (type and amount) before requesting approval."
      module={module}
      queryKey={['finance', 'petty-cash']}
      listRequests={() => listModuleRequests(module)}
      newButtonLabel="New Petty Cash Request"
      headerSchema={pettyCashHeaderSchema}
      headerDefaults={{ dateNeeded: today, description: '' }}
      buildHeaderPayload={(values) => ({ ...values, title: String(values.description || 'Petty Cash Request') })}
      headerFields={[
        { name: 'dateNeeded', label: 'Needed By Date', type: 'date', valuePaths: ['Needed_By_Date', 'RequiredDate', 'Required_Date'] },
        { name: 'description', label: 'Petty Cash Description & Reason', type: 'textarea', valuePaths: ['Posting_Description', 'PostingDescription', 'Narration'] },
      ]}
      detailFields={[
        { label: 'Request No.', paths: ['request.requestNo'] },
        { label: 'Needed By Date', paths: ['payload.Needed_By_Date', 'payload.RequiredDate', 'payload.Required_Date'], format: 'date' },
        { label: 'Description', paths: ['payload.Posting_Description', 'payload.PostingDescription', 'payload.Narration'] },
        { label: 'Department', paths: ['request.departmentName', 'request.departmentCode', 'payload.ShortcutDimension2Code'] },
        { label: 'Responsibility Center', paths: ['request.responsibleCenter', 'payload.ResponsibilityCenter'] },
        { label: 'Employee Account', paths: ['payload.EmployeeAccountNo', 'payload.CustomerNo', 'payload.ImprestNo'] },
        { label: 'Total Net Amount', paths: ['payload.TotalNetAmount', 'request.amount'], format: 'currency' },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      line={{
        label: 'Petty Cash Lines',
        addLabel: 'Add Line',
        schema: pettyCashLineSchema,
        defaultValues: { type: '', name: '', amount: 0 },
        fields: [
          { name: 'type', label: 'Type', type: 'select', options: paymentTypes.options },
          { name: 'amount', label: 'Amount', type: 'number' },
        ],
        columns: [
          { key: 'type', header: 'Type' },
          { key: 'name', header: 'Name' },
          { key: 'amount', header: 'Amount', format: (value) => formatCurrency(Number(value ?? 0)) },
        ],
        emptyText: '*** No Petty Cash Lines Found ***',
        canEdit: false,
      }}
      businessRules={[
        'Create the requisition header, then add one line per expense type.',
        'The total amount is the sum of the requisition lines.',
      ]}
    />
  )
}
