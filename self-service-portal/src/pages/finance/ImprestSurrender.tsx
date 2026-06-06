import { formatISO } from 'date-fns'
import { createImprestSurrender, listImprestRequests } from '@/api/endpoints/imprest'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { imprestSurrenderSchema, type ImprestSurrenderForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function ImprestSurrender() {
  return (
    <RequestFormPage
      title="Imprest Surrender"
      schema={imprestSurrenderSchema}
      queryKey={['finance', 'imprest-surrender']}
      listRequests={listImprestRequests}
      createRequest={(values) => createImprestSurrender(values as ImprestSurrenderForm)}
      source="Finance requirements workbook"
      defaultValues={{
        imprestNo: 'ADV-000421',
        surrenderDate: today,
        amountUsed: 0,
        amountReturned: 0,
        outstandingBalance: 0,
        notes: '',
        attachments: [],
      }}
      fields={[
        { name: 'imprestNo', label: 'Imprest source document', type: 'text' },
        { name: 'surrenderDate', label: 'Surrender date', type: 'date' },
        { name: 'amountUsed', label: 'Amount used', type: 'number' },
        { name: 'amountReturned', label: 'Amount returned', type: 'number' },
        { name: 'outstandingBalance', label: 'Outstanding balance', type: 'number' },
        { name: 'notes', label: 'Surrender notes', type: 'textarea' },
        { name: 'attachments', label: 'Settlement attachments', type: 'files' },
      ]}
      moduleConfig={{ module: 'imprestSurrender', entity: 'selfServiceImprestSurrenders' }}
      businessRules={[
        'Partial surrender is allowed and outstanding balance remains visible.',
        'Supporting attachment is mandatory before settlement.',
        'Surrender links to the original imprest source document number.',
      ]}
    />
  )
}
