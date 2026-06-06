import { formatISO } from 'date-fns'
import { createFuelRequest, listFuelRequests } from '@/api/endpoints/fuelRequest'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { fuelRequestSchema, type FuelRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function FuelRequest() {
  return (
    <RequestFormPage
      title="Fuel Requisition"
      description="Request fuel against vehicle, driver, odometer, and trip purpose with ERP transport linkage."
      schema={fuelRequestSchema}
      queryKey={['facility', 'fuel-request']}
      listRequests={listFuelRequests}
      createRequest={(values) => createFuelRequest(values as FuelRequestForm)}
      source="Facility requirements workbook"
      defaultValues={{ requestDate: today, vehicleNo: '', driverName: '', liters: 0, odometer: 0, purpose: '' }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'vehicleNo', label: 'Vehicle number', type: 'text' },
        { name: 'driverName', label: 'Driver name', type: 'text' },
        { name: 'liters', label: 'Fuel liters', type: 'number' },
        { name: 'odometer', label: 'Odometer', type: 'number' },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
      ]}
      moduleConfig={{ module: 'fuelRequest', entity: 'selfServiceFuelRequests' }}
      businessRules={[
        'Fuel issue links to transport request or work ticket.',
        'Vehicle and odometer are mandatory for audit trail.',
        'ERP posts fuel reference back to the source document.',
      ]}
    />
  )
}
