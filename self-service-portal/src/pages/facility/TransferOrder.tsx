import { formatISO } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { MultiStepRequestPage } from '@/components/shared/MultiStepRequestPage'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { transferOrderHeaderSchema, transferOrderLineSchema } from '@/schemas/requestSchemas'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })
const module = { module: 'transferOrder', entity: 'selfServiceTransferOrders' } as const

export function TransferOrder() {
  const [searchParams] = useSearchParams()
  const locations = useLookupOptions('regular-locations')
  const inTransitLocations = useLookupOptions('in-transit-locations')
  const shippingAgents = useLookupOptions('shipping-agents')
  const items = useLookupOptions('items')

  return (
    <MultiStepRequestPage
      title="Transfer Order"
      headerLabel="New Transfer Order (Header)"
      description="Create the transfer order header, then add item lines before requesting approval."
      module={module}
      queryKey={['facility', 'transfer-order']}
      listRequests={() => listModuleRequests(module)}
      newButtonLabel="New Request"
      initialMode={searchParams.get('new') === '1' ? 'create' : 'list'}
      headerSchema={transferOrderHeaderSchema}
      headerDefaults={{
        from: '',
        to: '',
        inTransit: '',
        truckNo: '',
        postingDate: today,
        driverName: '',
      }}
      buildHeaderPayload={(values) => ({
        ...values,
        fromCode: values.from,
        toCode: values.to,
        title: `Transfer ${values.from || ''} → ${values.to || ''}`,
      })}
      headerFields={[
        { name: 'from', label: 'From', type: 'select', options: locations.options, valuePaths: ['TransferfromCode', 'TransferFromCode'] },
        { name: 'to', label: 'To', type: 'select', options: locations.options, valuePaths: ['TransfertoCode', 'TransferToCode'] },
        { name: 'inTransit', label: 'In Transit Code', type: 'select', options: inTransitLocations.options, valuePaths: ['InTransitCode', 'In_Transit_Code'] },
        { name: 'truckNo', label: 'Truck No.', type: 'select', options: shippingAgents.options, valuePaths: ['ShippingAgentCode', 'Shipping_Agent_Code'] },
        { name: 'postingDate', label: 'Posting Date', type: 'date', valuePaths: ['PostingDate', 'Posting_Date'] },
        { name: 'driverName', label: 'Driver Name', type: 'text', valuePaths: ['TransfertoAddress', 'TransferToAddress'] },
      ]}
      detailFields={[
        { label: 'Transfer No.', paths: ['request.requestNo'] },
        { label: 'From', paths: ['payload.TransferfromCode', 'payload.TransferFromCode'] },
        { label: 'To', paths: ['payload.TransfertoCode', 'payload.TransferToCode'] },
        { label: 'In Transit Code', paths: ['payload.InTransitCode', 'payload.In_Transit_Code'] },
        { label: 'Posting Date', paths: ['payload.PostingDate', 'payload.Posting_Date'], format: 'date' },
        { label: 'Truck No.', paths: ['payload.ShippingAgentCode', 'payload.Shipping_Agent_Code'] },
        { label: 'Driver Name', paths: ['payload.TransfertoAddress', 'payload.TransferToAddress'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      line={{
        label: 'Requisition Lines',
        addLabel: 'New Line',
        canEdit: false,
        schema: transferOrderLineSchema,
        defaultValues: { itemNo: '', quantity: 1 },
        buildLinePayload: (values) => ({ ...values, item: values.itemNo }),
        fields: [
          { name: 'itemNo', label: 'Item No.', type: 'select', options: items.options },
          { name: 'quantity', label: 'Quantity', type: 'number' },
        ],
        columns: [
          { key: 'itemNo', header: 'Item No' },
          { key: 'description', header: 'Description' },
          { key: 'quantity', header: 'Quantity' },
          { key: 'unitOfMeasure', header: 'Unit of Measure' },
          { key: 'quantityShipped', header: 'Quantity Shipped' },
          { key: 'quantityReceived', header: 'Quantity Received' },
          { key: 'shipmentDate', header: 'Shipment Date' },
          { key: 'receiptDate', header: 'Receipt Date' },
        ],
        emptyText: '*** No Transfer Lines Found ***',
      }}
      businessRules={[
        'Locations and items must exist in Business Central.',
        'Create the header first, then add transfer lines.',
        'Request approval once all lines are captured.',
      ]}
    />
  )
}
