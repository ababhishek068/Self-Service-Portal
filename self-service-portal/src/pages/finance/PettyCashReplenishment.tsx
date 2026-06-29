import { formatISO } from 'date-fns'
import {
  createPettyCashReplenishment,
  listPettyCashReplenishments,
} from '@/api/endpoints/pettyCash'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { useEmployeeDefaults } from '@/hooks/useEmployeeDefaults'
import {
  pettyCashReplenishmentSchema,
  type PettyCashReplenishmentForm,
} from '@/schemas/requestSchemas'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })
export function PettyCashReplenishment() {
  const { departmentCode } = useEmployeeDefaults()
  const sectors = useLookupOptions('sectors')
  const divisions = useLookupOptions('divisions')
  const departments = useLookupOptions('departments')
  const bankAccounts = useLookupOptions('bank-accounts')

  return (
    <RequestFormPage
      title="Petty Cash Replenishment"
      description="Request replenishment of the departmental petty cash float."
      schema={pettyCashReplenishmentSchema}
      queryKey={['finance', 'petty-cash-replenishment']}
      listRequests={listPettyCashReplenishments}
      createRequest={(values) => createPettyCashReplenishment(values as PettyCashReplenishmentForm)}
      moduleConfig={{ module: 'pettyCashReplenishment', entity: 'selfServicePettyCashReplenishments' }}
      defaultValues={{
        dateCreated: today,
        sector: '',
        division: '',
        department: departmentCode,
        payingAccount: '',
        sourceAmount: 0,
        receivingAccount: '',
        receivingAmount: 0,
        remarks: '',
        attachments: [],
      }}
      fields={[
        { name: 'dateCreated', label: 'Date created', type: 'date', valuePaths: ['DateCreated', 'Date_Created'] },
        { name: 'sector', label: 'Sector', type: 'select', options: sectors.options, valuePaths: ['Sector'], placeholder: sectors.isLoading ? 'Loading sectors…' : sectors.isError ? 'Could not load sectors' : 'Select sector' },
        { name: 'division', label: 'Division / Branch', type: 'select', options: divisions.options, valuePaths: ['Division'], placeholder: divisions.isLoading ? 'Loading divisions…' : divisions.isError ? 'Could not load divisions' : 'Select division' },
        { name: 'department', label: 'Department / District', type: 'select', options: departments.options, valuePaths: ['Department'], placeholder: departments.isLoading ? 'Loading departments…' : departments.isError ? 'Could not load departments' : 'Select department' },
        { name: 'payingAccount', label: 'Paying account', type: 'select', options: bankAccounts.options, valuePaths: ['PayingAccount', 'Paying_Account'], placeholder: bankAccounts.isLoading ? 'Loading accounts…' : bankAccounts.isError ? 'Could not load accounts' : 'Select paying account' },
        { name: 'sourceAmount', label: 'Source amount', type: 'number', valuePaths: ['SourceAmount', 'Source_Amount'] },
        { name: 'receivingAccount', label: 'Receiving account', type: 'select', options: bankAccounts.options, valuePaths: ['ReceivingAccount', 'Receiving_Account'], placeholder: bankAccounts.isLoading ? 'Loading accounts…' : bankAccounts.isError ? 'Could not load accounts' : 'Select receiving account' },
        { name: 'receivingAmount', label: 'Receiving amount', type: 'number', valuePaths: ['ReceivingAmount', 'Receiving_Amount'] },
        { name: 'remarks', label: 'Remarks', type: 'textarea', valuePaths: ['Remarks'] },
        { name: 'attachments', label: 'Supporting documents', type: 'files' },
      ]}
      businessRules={[
        'This follows the ESS Inter-Bank Transfer workflow.',
        'Source and receiving account amounts are submitted to Business Central.',
        'Approval workflow is controlled by ERP.',
      ]}
    />
  )
}
