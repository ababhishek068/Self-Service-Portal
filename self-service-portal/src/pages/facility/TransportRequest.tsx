import { formatISO } from 'date-fns'
import { createTransportRequest, listTransportRequests } from '@/api/endpoints/transport'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { transportRequestSchema, type TransportRequestForm } from '@/types/forms.types'

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
      defaultValues={{ transportType: 'City', tripDate: today, destination: '', passengers: [''], purpose: '' }}
      fields={[
        {
          name: 'transportType',
          label: 'Transport type',
          type: 'select',
          options: ['City', 'Field'].map((value) => ({ label: value, value })),
        },
        { name: 'tripDate', label: 'Trip date', type: 'date' },
        { name: 'destination', label: 'Destination', type: 'text' },
        {
          name: 'passengers',
          label: 'Passenger list',
          type: 'lineItems',
          defaultLine: { name: '' },
          fields: [{ name: 'name', label: 'Passenger name', type: 'text' }],
        },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
      ]}
      businessRules={[
        'Trip date cannot be in the past.',
        'Driver and vehicle availability are checked before approval.',
        'Passenger list is retained with the source document.',
      ]}
    />
  )
}
