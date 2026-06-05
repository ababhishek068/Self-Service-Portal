import { formatISO } from 'date-fns'
import { createStaffClaim, listStaffClaims } from '@/api/endpoints/staffClaim'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments } from '@/data/departments'
import { hospitalCoverage } from '@/data/hospitalCoverage'
import { staffClaimSchema, type StaffClaimForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))

export function StaffClaim() {
  return (
    <RequestFormPage
      title="Staff Claim"
      description="Submit per diem, medical, and other claims with coverage calculation and mandatory supporting documents."
      schema={staffClaimSchema}
      queryKey={['finance', 'staff-claim']}
      listRequests={listStaffClaims}
      createRequest={(values) => createStaffClaim(values as StaffClaimForm)}
      source="Finance requirements workbook"
      defaultValues={{
        claimType: 'Medical',
        claimDate: today,
        departmentCode: 'BO',
        jobGrade: 'G7',
        placeOfDuty: 'Head Office',
        employeeAccountNumber: '1000459922',
        hospitalCategory: 'Panel Hospital A',
        coveragePercent: 90,
        grossAmount: 0,
        description: '',
        attachments: [],
      }}
      fields={[
        {
          name: 'claimType',
          label: 'Claim type',
          type: 'select',
          options: ['Per Diem & Accommodation', 'Medical', 'Other'].map((value) => ({ label: value, value })),
        },
        { name: 'claimDate', label: 'Claim date', type: 'date' },
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'jobGrade', label: 'Job grade', type: 'text', readOnly: true },
        { name: 'placeOfDuty', label: 'Place of duty', type: 'text' },
        { name: 'employeeAccountNumber', label: 'Employee account', type: 'text', readOnly: true },
        {
          name: 'hospitalCategory',
          label: 'Hospital category',
          type: 'select',
          options: hospitalCoverage.map((item) => ({ label: item.category, value: item.category })),
        },
        { name: 'coveragePercent', label: 'Coverage percent', type: 'number' },
        { name: 'grossAmount', label: 'Gross amount', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'attachments', label: 'Supporting documents', type: 'files' },
      ]}
      businessRules={[
        'Medical claims require hospital category and coverage percent.',
        'Department, job grade, place of duty, account, and net amount remain visible.',
        'All claim types require supporting documents.',
      ]}
    />
  )
}
