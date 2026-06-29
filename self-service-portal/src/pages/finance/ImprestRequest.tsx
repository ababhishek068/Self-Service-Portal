import { formatISO } from 'date-fns'
import { MultiStepRequestPage } from '@/components/shared/MultiStepRequestPage'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { imprestTypeOptions } from '@/data/essOptions'
import { imprestHeaderSchema, imprestLineHeaderSchema } from '@/schemas/requestSchemas'
import { formatCurrency } from '@/utils/formatters'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })
const module = { module: 'imprest', entity: 'selfServiceImprestRequests' } as const

export function ImprestRequest() {
  const imprestTypes = useLookupOptions('imprest-types', imprestTypeOptions)
  const destinations = useLookupOptions('travel-destinations')

  return (
    <MultiStepRequestPage
      title="Imprest Requisition"
      headerLabel="New Imprest Requisition"
      description="Create the imprest header, then add advance lines (type, destination, duty area, days, amount) before requesting approval."
      module={module}
      queryKey={['finance', 'imprest']}
      listRequests={() => listModuleRequests(module)}
      newButtonLabel="New Imprest Requisition"
      headerSchema={imprestHeaderSchema}
      headerDefaults={{ dateRequired: today, purpose: '', travelDate: today, returnDate: today }}
      buildHeaderPayload={(values) => ({
        ...values,
        startDate: values.travelDate,
        title: String(values.purpose || 'Imprest Requisition'),
      })}
      headerFields={[
        { name: 'dateRequired', label: 'Date Required', type: 'date', valuePaths: ['DateRequired', 'Date_Required', 'Date'] },
        { name: 'purpose', label: 'Imprest Purpose', type: 'textarea', valuePaths: ['Purpose'] },
        { name: 'travelDate', label: 'Travel Date', type: 'date', valuePaths: ['TravelDate', 'Travel_Date', 'Date'] },
        { name: 'returnDate', label: 'Return Date', type: 'date', valuePaths: ['ReturnDate', 'Return_Date', 'Date'] },
      ]}
      detailFields={[
        { label: 'Request No.', paths: ['request.requestNo'] },
        { label: 'Date Required', paths: ['payload.DateRequired', 'payload.Date_Required'], format: 'date' },
        { label: 'Purpose', paths: ['payload.Purpose', 'payload.purpose'] },
        { label: 'Travel Date', paths: ['payload.TravelDate', 'payload.Travel_Date'], format: 'date' },
        { label: 'Return Date', paths: ['payload.ReturnDate', 'payload.Return_Date'], format: 'date' },
        { label: 'Department', paths: ['request.departmentName', 'request.departmentCode', 'payload.ShortcutDimension2Code'] },
        { label: 'Responsibility Center', paths: ['request.responsibleCenter', 'payload.ResponsibilityCenter'] },
        { label: 'Place of Duty', paths: ['payload.PlaceofDuty', 'payload.PlaceOfDuty', 'payload.DutyArea'] },
        { label: 'Employee Account', paths: ['payload.EmployeeAccountNo', 'payload.CustomerNo', 'payload.ImprestNo'] },
        { label: 'Total Net Amount', paths: ['payload.TotalNetAmount', 'request.amount'], format: 'currency' },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      line={{
        label: 'Imprest Lines',
        addLabel: 'Add Imprest Line',
        schema: imprestLineHeaderSchema,
        defaultValues: {
          advanceType: '',
          destination: '',
          dutyArea: '',
          noOfDays: 1,
          amount: 0,
        },
        fields: [
          { name: 'advanceType', label: 'Advance Type', type: 'select', options: imprestTypes.options },
          { name: 'destination', label: 'Travel Destination', type: 'select', options: destinations.options },
          { name: 'dutyArea', label: 'Duty Area', type: 'text' },
          { name: 'noOfDays', label: 'No. of Days', type: 'number' },
          { name: 'amount', label: 'Amount', type: 'number' },
        ],
        columns: [
          { key: 'advanceType', header: 'Advance Type' },
          { key: 'destination', header: 'Travel Destination' },
          { key: 'accountNo', header: 'Account No.' },
          { key: 'accountName', header: 'Account Name' },
          { key: 'amount', header: 'Amount', format: (value) => formatCurrency(Number(value ?? 0)) },
          { key: 'noOfDays', header: 'No of Days' },
        ],
        emptyText: '*** No Imprest Lines Found ***',
        canEdit: false,
      }}
      businessRules={[
        'Create the imprest header first, then add one or more advance lines.',
        'Each line captures advance type, destination, duty area, days and amount.',
        'Attach supporting documents, then request approval.',
      ]}
    />
  )
}
