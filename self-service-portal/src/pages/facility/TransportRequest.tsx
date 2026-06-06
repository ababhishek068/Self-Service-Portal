import { formatISO } from 'date-fns'
import { createTransportRequest, listTransportRequests } from '@/api/endpoints/transport'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { transportRequestSchema, type TransportRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function TransportRequest() {
  return (
    <RequestFormPage
      title="Transport Request"
      description="Create city or field transport requests with passenger list, driver assignment readiness, and no backdated trip dates."
      schema={transportRequestSchema}
      queryKey={['facility', 'transport-request']}
      listRequests={listTransportRequests}
      createRequest={(values) => createTransportRequest(values as TransportRequestForm)}
      source="ERP facility and procurement 21st.xlsx"
      defaultValues={{
        transportType: 'City',
        tripDate: today,
        tripTime: '09:00',
        destination: '',
        passengers: [{ name: '', passengerType: 'Internal' }],
        purpose: '',
      }}
      fields={[
        {
          name: 'transportType',
          label: 'Transport type',
          type: 'select',
          options: ['City', 'Field'].map((value) => ({ label: value, value })),
        },
        { name: 'tripDate', label: 'Trip date', type: 'date' },
        { name: 'tripTime', label: 'Trip time', type: 'text', placeholder: 'HH:MM' },
        { name: 'destination', label: 'Destination', type: 'text' },
        {
          name: 'passengers',
          label: 'Passenger list (internal and external)',
          type: 'lineItems',
          defaultLine: { name: '', passengerType: 'Internal' },
          fields: [
            { name: 'name', label: 'Passenger name', type: 'text' },
            {
              name: 'passengerType',
              label: 'Type',
              type: 'select',
              options: [
                { label: 'Internal', value: 'Internal' },
                { label: 'External', value: 'External' },
              ],
            },
          ],
        },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
      ]}
      moduleConfig={{ module: 'transport', entity: 'selfServiceTransportRequests' }}
      businessRules={[
        'Trip date cannot be in the past.',
        'Duplicate vehicle requests for the same day are blocked.',
        'Passenger list (internal and external) is retained with the source document.',
        'Line manager approval is required before dispatch.',
      ]}
    />
  )
}
