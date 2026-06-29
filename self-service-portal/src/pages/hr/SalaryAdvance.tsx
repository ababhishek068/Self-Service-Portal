import { createSalaryAdvanceRequest, listSalaryAdvanceRequests } from '@/api/endpoints/salaryAdvance'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { salaryAdvanceSchema, type SalaryAdvanceForm } from '@/schemas/requestSchemas'

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
      defaultValues={{ purpose: '', percentageSalary: 0 }}
      fields={[
        { name: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'State the purpose of the advance', valuePaths: ['Purpose'] },
        { name: 'percentageSalary', label: 'Percentage of salary', type: 'number', valuePaths: ['PercentageofSalary', 'lines.0.PercentageofSalary', 'lines.0.PercentageOfSalary'] },
      ]}
      businessRules={[
        'The percentage cannot exceed 100 percent of salary.',
        'Advance routes through payroll approval workflow.',
        'Repayment terms are calculated in Business Central.',
      ]}
      detailFields={[
        { label: 'Request No.', paths: ['request.requestNo'] },
        { label: 'Requested Date', paths: ['payload.Date', 'payload.RequestedDate', 'request.createdAt'], format: 'date' },
        { label: 'Purpose', paths: ['payload.Purpose', 'payload.purpose'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      detailLineLabel="Salary Advance Line"
      detailLineColumns={[
        { label: 'Date Taken', paths: ['DateTaken', 'Date_Taken'], format: 'date' },
        { label: 'Type', paths: ['AdvanceType', 'Advance_Type'] },
        { label: 'Purpose', paths: ['Purpose', 'purpose'] },
        { label: 'Percentage of Salary', paths: ['PercentageofSalary', 'PercentageOfSalary', 'Percentage_of_Salary'], format: 'percentage' },
        { label: 'Amount', paths: ['Amount', 'amount'], format: 'currency' },
      ]}
      hideDetailAttachments
    />
  )
}
