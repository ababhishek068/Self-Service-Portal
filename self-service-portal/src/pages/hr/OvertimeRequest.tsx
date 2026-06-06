import { formatISO } from 'date-fns'
import { createOvertimeRequest, listOvertimeRequests } from '@/api/endpoints/hr'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { overtimeRequestSchema, type OvertimeRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function OvertimeRequest() {
  return (
    <RequestFormPage
      title="Overtime Request"
      description="Request overtime with work date, time window, hours, and manager approval workflow."
      schema={overtimeRequestSchema}
      queryKey={['hr', 'overtime-request']}
      listRequests={listOvertimeRequests}
      createRequest={(values) => createOvertimeRequest(values as OvertimeRequestForm)}
      source="ERP Hr may 21st .xlsx"
      defaultValues={{ workDate: today, startTime: '17:00', endTime: '20:00', hours: 3, reason: '' }}
      fields={[
        { name: 'workDate', label: 'Work date', type: 'date' },
        { name: 'startTime', label: 'Start time', type: 'text' },
        { name: 'endTime', label: 'End time', type: 'text' },
        { name: 'hours', label: 'Hours', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'textarea' },
      ]}
      moduleConfig={{ module: 'overtime', entity: 'selfServiceOvertimeRequests' }}
      businessRules={[
        'Overtime requests route to manager approval.',
        'Approved overtime can feed payroll-facing information.',
        'Maker/checker audit trail is retained.',
      ]}
    />
  )
}
