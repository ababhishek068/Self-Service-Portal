import { formatISO } from 'date-fns'
import { createTravelRequest, listTravelRequests } from '@/api/endpoints/hr'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { travelRequestSchema, type TravelRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function TravelRequest() {
  return (
    <RequestFormPage
      title="Travel Request"
      description="Create employee travel requests with optional linked expense claim creation."
      schema={travelRequestSchema}
      queryKey={['hr', 'travel-request']}
      listRequests={listTravelRequests}
      createRequest={(values) => createTravelRequest(values as TravelRequestForm)}
      source="ERP Hr may 21st .xlsx"
      defaultValues={{ travelDate: today, returnDate: today, destination: '', purpose: '', estimatedExpense: 0, createExpenseClaim: true }}
      fields={[
        { name: 'travelDate', label: 'Travel date', type: 'date' },
        { name: 'returnDate', label: 'Return date', type: 'date' },
        { name: 'destination', label: 'Destination', type: 'text' },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
        { name: 'estimatedExpense', label: 'Estimated expense', type: 'number' },
        { name: 'createExpenseClaim', label: 'Create linked expense claim', type: 'checkbox' },
      ]}
      moduleConfig={{ module: 'travel', entity: 'selfServiceTravelRequests' }}
      businessRules={[
        'Travel can create linked staff claim for expenses.',
        'Travel approval retains source document number.',
        'Approved travel data is available to HR and Finance workflows.',
      ]}
    />
  )
}
