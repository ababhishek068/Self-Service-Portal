import { formatISO } from 'date-fns'
import { createPurchaseRequisition, listPurchaseRequisitions } from '@/api/endpoints/purchaseRequisition'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments } from '@/data/departments'
import { purchaseRequisitionSchema, type PurchaseRequisitionForm } from '@/schemas/requestSchemas'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))

export function PurchaseRequisition() {
  return (
    <RequestFormPage
      title="Purchase Requisition"
      description="Create item, service, or fixed asset purchase requisitions with specs, brand, stake, attachment, and approval actions."
      schema={purchaseRequisitionSchema}
      queryKey={['facility', 'purchase-requisition']}
      listRequests={listPurchaseRequisitions}
      createRequest={(values) => createPurchaseRequisition(values as PurchaseRequisitionForm)}
      source="Facility requirements workbook"
      defaultValues={{
        requestDate: today,
        departmentCode: 'BO',
        responsibleCenter: 'HO-BO',
        reason: '',
        lines: [
          {
            itemType: 'Item',
            quantity: 1,
            uom: 'Pcs',
            description: '',
            brand: '',
            standard: '',
            specification: '',
            stake: 'Branch Operations',
            amount: 0,
          },
        ],
        attachments: [],
      }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'responsibleCenter', label: 'Responsible center', type: 'text' },
        { name: 'reason', label: 'Business reason', type: 'textarea' },
        {
          name: 'lines',
          label: 'Purchase lines',
          type: 'lineItems',
          defaultLine: { itemType: 'Item', quantity: 1, uom: 'Pcs', description: '', brand: '', standard: '', specification: '', stake: '', amount: 0 },
          fields: [
            {
              name: 'itemType',
              label: 'Type',
              type: 'select',
              options: ['Item', 'Service', 'Fixed Asset'].map((value) => ({ label: value, value })),
            },
            { name: 'quantity', label: 'Qty', type: 'number' },
            { name: 'uom', label: 'UoM', type: 'text' },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'brand', label: 'Brand', type: 'text' },
            { name: 'standard', label: 'Standard', type: 'text' },
            { name: 'specification', label: 'Specification', type: 'text' },
            { name: 'stake', label: 'Stakeholder', type: 'text' },
            { name: 'amount', label: 'Amount', type: 'number' },
          ],
        },
        { name: 'attachments', label: 'Attachment', type: 'files' },
      ]}
      businessRules={[
        'Duplicate purchase requests within 24 hours are blocked.',
        'Approval workflow supports cancel, reject, and amend.',
        'Item, service, and fixed asset lines capture brand, standard, specification, stake, and attachment.',
      ]}
    />
  )
}
