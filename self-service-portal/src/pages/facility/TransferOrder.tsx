import { formatISO } from 'date-fns'
import { createTransferOrder, listTransferOrders } from '@/api/endpoints/maintenance'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { buildFaTagNumber } from '@/utils/validators'
import { transferOrderSchema, type TransferOrderForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function TransferOrder() {
  return (
    <RequestFormPage
      title="Transfer Order"
      description="Record temporary or permanent vehicle and asset handover with custodian audit trail."
      schema={transferOrderSchema}
      queryKey={['facility', 'transfer-order']}
      listRequests={listTransferOrders}
      createRequest={(values) => createTransferOrder(values as TransferOrderForm)}
      source="Facility requirements workbook"
      defaultValues={{
        transferType: 'Temporary',
        assetTagNumber: buildFaTagNumber('BO', 'IT', 'FA112', 7),
        fromEmployee: '',
        toEmployee: '',
        handoverDate: today,
        returnDate: today,
        notes: '',
      }}
      fields={[
        {
          name: 'transferType',
          label: 'Transfer type',
          type: 'select',
          options: ['Temporary', 'Permanent'].map((value) => ({ label: value, value })),
        },
        { name: 'assetTagNumber', label: 'Asset or vehicle tag', type: 'text' },
        { name: 'fromEmployee', label: 'Current custodian', type: 'text' },
        { name: 'toEmployee', label: 'Receiving custodian', type: 'text' },
        { name: 'handoverDate', label: 'Handover date', type: 'date' },
        { name: 'returnDate', label: 'Return date', type: 'date' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      businessRules={[
        'Temporary handover requires return date.',
        'Permanent handover updates asset custodian in ERP.',
        'Every transfer keeps maker/checker timestamp audit.',
      ]}
    />
  )
}
