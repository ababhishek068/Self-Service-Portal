import { formatISO } from 'date-fns'
import { createMaintenanceRequest, listMaintenanceRequests } from '@/api/endpoints/maintenance'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { buildFaTagNumber } from '@/utils/validators'
import { maintenanceRequestSchema, type MaintenanceRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function MaintenanceRequest() {
  return (
    <RequestFormPage
      title="Maintenance Request"
      description="Submit fixed asset maintenance work tickets using HB asset tag numbers and priority-driven routing."
      schema={maintenanceRequestSchema}
      queryKey={['facility', 'maintenance-request']}
      listRequests={listMaintenanceRequests}
      createRequest={(values) => createMaintenanceRequest(values as MaintenanceRequestForm)}
      source="Facility requirements workbook"
      defaultValues={{
        requestDate: today,
        faTagNumber: buildFaTagNumber('BO', 'IT', 'FA112', 7),
        priority: 'Medium',
        location: '',
        issueDescription: '',
        attachments: [],
      }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'faTagNumber', label: 'FA tag number', type: 'text' },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          options: ['Low', 'Medium', 'High', 'Critical'].map((value) => ({ label: value, value })),
        },
        { name: 'location', label: 'Location', type: 'text' },
        { name: 'issueDescription', label: 'Issue description', type: 'textarea' },
        { name: 'attachments', label: 'Photos or documents', type: 'files' },
      ]}
      moduleConfig={{ module: 'maintenance', entity: 'selfServiceMaintenanceRequests' }}
      businessRules={[
        'FA maintenance requires asset tag number.',
        'Priority determines SLA and escalation.',
        'Completion requires technician notes in ERP.',
      ]}
    />
  )
}
