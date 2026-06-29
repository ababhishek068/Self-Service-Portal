import { formatISO } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { MultiStepRequestPage } from '@/components/shared/MultiStepRequestPage'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { storeLineTypeOptions } from '@/data/essOptions'
import { storeHeaderSchema, storeLineSchema } from '@/schemas/requestSchemas'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })
const module = { module: 'storeRequisition', entity: 'selfServiceStoreRequisitions' } as const

export function StoreRequisition() {
  const [searchParams] = useSearchParams()
  const locations = useLookupOptions('locations')
  const items = useLookupOptions('items')
  const assets = useLookupOptions('assets')

  return (
    <MultiStepRequestPage
      title="Store Requisition"
      headerLabel="New Store Requisition"
      description="Create the store requisition header, then add item or asset lines before requesting approval."
      module={module}
      queryKey={['facility', 'store-requisition']}
      listRequests={() => listModuleRequests(module)}
      newButtonLabel="New Request"
      initialMode={searchParams.get('new') === '1' ? 'create' : 'list'}
      headerSchema={storeHeaderSchema}
      headerDefaults={{ dateRequired: today, description: '' }}
      buildHeaderPayload={(values) => ({
        ...values,
        requestDate: values.dateRequired,
        requestDescription: values.description,
        title: String(values.description || 'Store Requisition'),
      })}
      headerFields={[
        { name: 'dateRequired', label: 'Date Required', type: 'date', valuePaths: ['RequiredDate', 'Required_Date', 'RequestDate'] },
        { name: 'description', label: 'Request Description', type: 'textarea', valuePaths: ['RequestDescription', 'Request_Description'] },
      ]}
      detailFields={[
        { label: 'Requisition No.', paths: ['request.requestNo'] },
        { label: 'Date Required', paths: ['payload.RequiredDate', 'payload.Required_Date', 'payload.RequestDate'], format: 'date' },
        { label: 'Description', paths: ['payload.RequestDescription', 'payload.Request_Description'] },
        { label: 'Department', paths: ['request.departmentName', 'request.departmentCode', 'payload.ShortcutDimension2Code'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      line={{
        label: 'Requisition Lines',
        addLabel: 'New Line',
        schema: storeLineSchema,
        defaultValues: { type: '1', issuingStore: '', itemNo: '', description: '', quantity: 1 },
        buildLinePayload: (values) => ({
          ...values,
          location: values.issuingStore,
          item: values.itemNo,
        }),
        fields: [
          { name: 'type', label: 'Type', type: 'select', options: storeLineTypeOptions },
          { name: 'issuingStore', label: 'Issuing Store', type: 'select', options: locations.options },
          {
            name: 'itemNo',
            label: 'Item / Asset No.',
            type: 'select',
            optionsByField: {
              field: 'type',
              options: { '1': items.options, '2': assets.options },
            },
          },
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'quantity', label: 'Quantity Requested', type: 'number' },
        ],
        columns: [
          { key: 'type', header: 'Type' },
          { key: 'issuingStore', header: 'Issuing Store' },
          { key: 'itemNo', header: 'No.' },
          { key: 'description', header: 'Description' },
          { key: 'quantity', header: 'Quantity Requested' },
          { key: 'quantityIssued', header: 'Quantity Issued' },
          { key: 'quantityToReceive', header: 'Quantity To Receive' },
          { key: 'quantityReceived', header: 'Quantity Received' },
          { key: 'reason', header: 'Reason' },
        ],
        emptyText: '*** No Store Lines Found ***',
        canEdit: false,
      }}
      businessRules={[
        'Create the header first, then add item or asset lines.',
        'Each line specifies type, issuing store, item number and quantity.',
        'Attach supporting documents, then request approval.',
      ]}
    />
  )
}
