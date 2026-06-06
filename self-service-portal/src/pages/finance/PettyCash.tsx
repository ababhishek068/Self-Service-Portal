import { formatISO } from 'date-fns'
import { createPettyCashRequest, listPettyCashRequests } from '@/api/endpoints/pettyCash'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments } from '@/data/departments'
import { useEmployeeDefaults } from '@/hooks/useEmployeeDefaults'
import { pettyCashSchema, type PettyCashForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))

export function PettyCash() {
  const { departmentCode, responsibleCenter } = useEmployeeDefaults()

  return (
    <RequestFormPage
      title="Petty Cash"
      description="Manage petty cash request, Petty Cash Replenishment, and Petty Cash Settlement with department limits."
      schema={pettyCashSchema}
      queryKey={['finance', 'petty-cash']}
      listRequests={listPettyCashRequests}
      createRequest={(values) => createPettyCashRequest(values as PettyCashForm)}
      source="Finance requirements workbook"
      defaultValues={{
        activity: 'Request',
        departmentCode,
        requestDate: today,
        amount: 0,
        limitAmount: 120000,
        costCenter: responsibleCenter,
        purpose: '',
        attachments: [],
      }}
      fields={[
        {
          name: 'activity',
          label: 'Activity',
          type: 'select',
          options: ['Request', 'Petty Cash Replenishment', 'Petty Cash Settlement'].map((value) => ({ label: value, value })),
        },
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'amount', label: 'Amount', type: 'number' },
        { name: 'limitAmount', label: 'Department limit', type: 'number', readOnly: true },
        { name: 'costCenter', label: 'Cost center', type: 'text' },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
        { name: 'attachments', label: 'Replenishment/settlement attachments', type: 'files' },
      ]}
      moduleConfig={{ module: 'pettyCash', entity: 'selfServicePettyCashRequests' }}
      businessRules={[
        'Department-based limits are loaded from ERP configuration.',
        'Approval workflow is controlled by ERP.',
        'Labels use Petty Cash Replenishment and Petty Cash Settlement.',
      ]}
    />
  )
}
