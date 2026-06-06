import { formatISO } from 'date-fns'
import { createPettyCashRequest, listPettyCashRequests } from '@/api/endpoints/pettyCash'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments } from '@/data/departments'
import { useEmployeeDefaults } from '@/hooks/useEmployeeDefaults'
import { pettyCashSchema, type PettyCashForm } from '@/schemas/requestSchemas'
import type { PortalRequest } from '@/types/erp.types'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))

async function listReplenishmentRequests(): Promise<PortalRequest[]> {
  const rows = await listPettyCashRequests()
  return rows.filter((row) => (row.payload as { activity?: string })?.activity === 'Petty Cash Replenishment')
}

export function PettyCashReplenishment() {
  const { departmentCode, responsibleCenter } = useEmployeeDefaults()

  return (
    <RequestFormPage
      title="Petty Cash Replenishment"
      description="Request replenishment of the departmental petty cash float."
      schema={pettyCashSchema}
      queryKey={['finance', 'petty-cash-replenishment']}
      listRequests={listReplenishmentRequests}
      createRequest={(values) =>
        createPettyCashRequest({ ...(values as PettyCashForm), activity: 'Petty Cash Replenishment' })
      }
      moduleConfig={{ module: 'pettyCash', entity: 'selfServicePettyCashRequests' }}
      defaultValues={{
        activity: 'Petty Cash Replenishment',
        departmentCode,
        requestDate: today,
        amount: 0,
        limitAmount: 120000,
        costCenter: responsibleCenter,
        purpose: '',
        attachments: [],
      }}
      fields={[
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'amount', label: 'Replenishment amount', type: 'number' },
        { name: 'limitAmount', label: 'Department limit', type: 'number', readOnly: true },
        { name: 'costCenter', label: 'Cost center', type: 'text' },
        { name: 'purpose', label: 'Purpose', type: 'textarea' },
        { name: 'attachments', label: 'Supporting documents', type: 'files' },
      ]}
      businessRules={[
        'Replenishment amount cannot exceed the departmental petty cash limit.',
        'Request date must equal the ERP working date.',
        'Approval workflow is controlled by ERP.',
      ]}
    />
  )
}
