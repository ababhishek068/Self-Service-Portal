import { formatISO } from 'date-fns'
import { createGatePass, listGatePasses } from '@/api/endpoints/gatePass'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { buildFaTagNumber } from '@/utils/validators'
import { gatePassSchema, type GatePassForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })

export function GatePass() {
  return (
    <RequestFormPage
      title="Gate Pass"
      description="Issue returnable or non-returnable gate passes, linked to asset register for fixed asset movement."
      schema={gatePassSchema}
      queryKey={['facility', 'gate-pass']}
      listRequests={listGatePasses}
      createRequest={(values) => createGatePass(values as GatePassForm)}
      source="Facility requirements workbook"
      defaultValues={{
        gatePassType: 'Returnable',
        assetTagNumber: buildFaTagNumber('BO', 'IT', 'FA112', 7),
        destination: '',
        issueDate: today,
        returnDate: today,
        reason: '',
        attachments: [],
      }}
      fields={[
        {
          name: 'gatePassType',
          label: 'Gate pass type',
          type: 'select',
          options: ['Returnable', 'Non-Returnable'].map((value) => ({ label: value, value })),
        },
        { name: 'assetTagNumber', label: 'Asset tag number', type: 'text' },
        { name: 'destination', label: 'Destination', type: 'text' },
        { name: 'issueDate', label: 'Issue date', type: 'date' },
        { name: 'returnDate', label: 'Return date', type: 'date' },
        { name: 'reason', label: 'Reason', type: 'textarea' },
        { name: 'attachments', label: 'Attachments', type: 'files' },
      ]}
      businessRules={[
        'Returnable gate pass requires return date.',
        'Fixed asset movement links to asset register.',
        'Gate Pass Log report is generated from submitted source documents.',
      ]}
    />
  )
}
