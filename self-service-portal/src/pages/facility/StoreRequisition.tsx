import { formatISO } from 'date-fns'
import { createStoreRequisition, listStoreRequisitions } from '@/api/endpoints/storeRequisition'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { departments, itemMaster } from '@/utils/constants'
import { buildFaTagNumber } from '@/utils/validators'
import { storeRequisitionSchema, type StoreRequisitionForm } from '@/types/forms.types'

const today = formatISO(new Date(), { representation: 'date' })
const departmentOptions = departments.map((department) => ({ label: department.name, value: department.code }))
const itemOptions = itemMaster.map((item) => ({ label: `${item.code} - ${item.description}`, value: item.code }))

export function StoreRequisition() {
  return (
    <RequestFormPage
      title="Store Requisition"
      description="Request inventory with item-code linking, department rights, budget check, duplicate controls, FA tag validation, and stock blocking."
      schema={storeRequisitionSchema}
      queryKey={['facility', 'store-requisition']}
      listRequests={listStoreRequisitions}
      createRequest={(values) => createStoreRequisition(values as StoreRequisitionForm)}
      source="ERP facility and procurement 21st.xlsx"
      defaultValues={{
        requestDate: today,
        departmentCode: 'BO',
        budgetAvailable: 120000,
        justification: '',
        lines: [
          {
            itemCode: 'ST032',
            description: 'Photocopy paper',
            quantity: 1,
            uom: 'Pcs',
            availableStock: 480,
            isFixedAsset: false,
            faTagNumber: '',
          },
        ],
        attachments: [],
      }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date' },
        { name: 'departmentCode', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'budgetAvailable', label: 'Budget available', type: 'number', readOnly: true },
        { name: 'justification', label: 'Justification', type: 'textarea' },
        {
          name: 'lines',
          label: 'Store items',
          type: 'lineItems',
          defaultLine: {
            itemCode: 'ST032',
            description: 'Photocopy paper',
            quantity: 1,
            uom: 'Pcs',
            availableStock: 480,
            isFixedAsset: false,
            faTagNumber: '',
          },
          fields: [
            { name: 'itemCode', label: 'Item code', type: 'select', options: itemOptions },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'quantity', label: 'Qty', type: 'number' },
            { name: 'uom', label: 'UoM', type: 'text' },
            { name: 'availableStock', label: 'Available stock', type: 'number', readOnly: true },
            { name: 'isFixedAsset', label: 'Fixed Asset item', type: 'checkbox' },
            { name: 'faTagNumber', label: 'FA tag number', type: 'text', placeholder: buildFaTagNumber('BO', 'IT', 'FA112', 7) },
          ],
        },
        { name: 'attachments', label: 'Attachments', type: 'files' },
      ]}
      businessRules={[
        'Item description and UoM resolve from item code.',
        'Department-scoped rights prevent requesting for unauthorized units.',
        'Budget check is required before approval.',
        'Duplicate items within 24 hours are blocked.',
        'Insufficient stock blocks posting.',
      ]}
    />
  )
}
