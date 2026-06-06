import { formatISO } from 'date-fns'
import { createSalaryAdvanceRequest, listSalaryAdvanceRequests } from '@/api/endpoints/salaryAdvance'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { salaryAdvanceSchema, type SalaryAdvanceForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function SalaryAdvance() {
  return (
    <RequestFormPage
      title="Salary Advance"
      description="Request an advance against salary with repayment schedule and approval workflow."
      schema={salaryAdvanceSchema}
      queryKey={['hr', 'salary-advance']}
      listRequests={listSalaryAdvanceRequests}
      createRequest={(values) => createSalaryAdvanceRequest(values as SalaryAdvanceForm)}
      moduleConfig={{ module: 'salaryAdvance', entity: 'selfServiceSalaryAdvanceRequests' }}
      defaultValues={{ requestDate: today, amount: 0, reason: '', repaymentMonths: 3 }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'amount', label: 'Advance amount', type: 'number' },
        { name: 'repaymentMonths', label: 'Repayment period (months)', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'textarea', placeholder: 'State the reason for the advance' },
      ]}
      businessRules={[
        'Request date must equal the ERP working date.',
        'Advance routes through payroll approval workflow.',
        'Repayment is deducted over the selected months.',
      ]}
    />
  )
}
