import { formatISO } from 'date-fns'
import { createImprestRequest, listImprestRequests } from '@/api/endpoints/imprest'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments } from '@/data/departments'
import { imprestRequestSchema, type ImprestRequestForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))

export function ImprestRequest() {
  return (
    <RequestFormPage
      title="Imprest Requisition"
      description="Create staff advance requisitions with same-day working date validation, multiple lines, and ERP workflow submission."
      schema={imprestRequestSchema}
      queryKey={['finance', 'imprest']}
      listRequests={listImprestRequests}
      createRequest={(values) => createImprestRequest(values as ImprestRequestForm)}
      source="Finance requirements workbook"
      defaultValues={{
        requisitionDate: today,
        startDate: today,
        returnDate: today,
        departmentCode: 'BO',
        jobGrade: 'G7',
        placeOfDuty: 'Head Office',
        employeeAccountNumber: '1000459922',
        responsibleCenter: 'HO-BO',
        purpose: '',
        lines: [{ expenseType: 'Per Diem', description: '', amount: 0 }],
        attachments: [],
      }}
      fields={[
        { name: 'requisitionDate', label: 'Requisition date', type: 'date' },
        { name: 'startDate', label: 'Start date', type: 'date' },
        { name: 'returnDate', label: 'Return date', type: 'date' },
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'jobGrade', label: 'Job grade', type: 'text', readOnly: true },
        { name: 'placeOfDuty', label: 'Place of duty', type: 'text' },
        { name: 'employeeAccountNumber', label: 'Employee account number', type: 'text', readOnly: true },
        { name: 'responsibleCenter', label: 'Responsible center', type: 'text', readOnly: true },
        { name: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'Business reason for the advance' },
        {
          name: 'lines',
          label: 'Imprest lines',
          type: 'lineItems',
          defaultLine: { expenseType: 'Per Diem', description: '', amount: 0 },
          fields: [
            {
              name: 'expenseType',
              label: 'Expense type',
              type: 'select',
              options: ['Per Diem', 'Transport', 'Accommodation', 'Other'].map((value) => ({ label: value, value })),
            },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'amount', label: 'Amount', type: 'number' },
          ],
        },
        { name: 'attachments', label: 'Attachments', type: 'files' },
      ]}
      businessRules={[
        'Requisition date must equal the ERP working date.',
        'Backdating and future-dating are blocked before submission.',
        'Duration, department, job grade, place of duty, and employee account number are displayed from HR master data.',
        'Maker cannot approve the same source document.',
      ]}
    />
  )
}
