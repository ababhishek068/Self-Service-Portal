import { formatISO } from 'date-fns'
import { createVehicleTransfer, listVehicleTransfers } from '@/api/endpoints/vehicleTransfer'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { vehicleTransferSchema, type VehicleTransferForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function VehicleTransfer() {
  return (
    <RequestFormPage
      title="Vehicle Transfer"
      description="Record vehicle handover between drivers or custodians with approval and audit trail."
      schema={vehicleTransferSchema}
      queryKey={['facility', 'vehicle-transfer']}
      listRequests={listVehicleTransfers}
      createRequest={(values) => createVehicleTransfer(values as VehicleTransferForm)}
      moduleConfig={{ module: 'vehicleTransfer', entity: 'selfServiceVehicleTransfers' }}
      source="Facility requirements workbook"
      defaultValues={{
        vehicleNo: '',
        fromDriver: '',
        toDriver: '',
        transferDate: today,
        odometer: 0,
        reason: '',
        attachments: [],
      }}
      fields={[
        { name: 'vehicleNo', label: 'Vehicle number', type: 'text' },
        { name: 'fromDriver', label: 'Current driver', type: 'text' },
        { name: 'toDriver', label: 'Receiving driver', type: 'text' },
        { name: 'transferDate', label: 'Transfer date', type: 'date' },
        { name: 'odometer', label: 'Odometer reading', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'textarea' },
        { name: 'attachments', label: 'Attachments', type: 'files' },
      ]}
      businessRules={[
        'Vehicle number, both custodians, date, and odometer reading are mandatory.',
        'Transfer request routes through the same maker/checker workflow as other facility requests.',
        'Approved transfers are retained in the portal request audit trail.',
      ]}
    />
  )
}
