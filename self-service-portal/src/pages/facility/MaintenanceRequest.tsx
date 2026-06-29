import { formatISO } from 'date-fns'
import { createMaintenanceRequest, listMaintenanceRequests } from '@/api/endpoints/maintenance'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { maintenanceRequestSchema, type MaintenanceRequestForm } from '@/schemas/requestSchemas'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const today = formatISO(new Date(), { representation: 'date' })

export function MaintenanceRequest() {
  const assets = useLookupOptions('assets')
  const vehicles = useLookupOptions('vehicles')

  return (
    <RequestFormPage
      title="Maintenance Request"
      description="Submit fixed asset maintenance work tickets using HB asset tag numbers and priority-driven routing."
      schema={maintenanceRequestSchema}
      queryKey={['facility', 'maintenance-request']}
      listRequests={listMaintenanceRequests}
      createRequest={(values) => createMaintenanceRequest(values as MaintenanceRequestForm)}
      source="Facility requirements workbook"
      defaultValues={{
        requestDate: today,
        requestType: '1',
        faTagNumber: '',
        vehicleNo: '',
        item: '',
        quantity: 1,
        priority: 'Medium',
        location: '',
        odometer: 0,
        lastServiceOdometer: 0,
        issueDescription: '',
        attachments: [],
      }}
      fields={[
        { name: 'requestDate', label: 'Request date', type: 'date', valuePaths: ['RequestDate', 'Request_Date', 'Date'] },
        {
          name: 'requestType',
          label: 'Maintenance type',
          type: 'select',
          valuePaths: ['RequestType', 'Request_Type'],
          options: [
            { label: 'Fixed Asset Maintenance', value: '1' },
            { label: 'Vehicle Service Maintenance', value: '2' },
          ],
        },
        { name: 'faTagNumber', label: 'FA tag number', type: 'select', options: assets.options, valuePaths: ['FATagNumber', 'VehicleNo', 'Vehicle_No'] },
        { name: 'vehicleNo', label: 'Vehicle registration number', type: 'select', options: vehicles.options, valuePaths: ['VehicleNo', 'Vehicle_No'] },
        { name: 'item', label: 'Item / service', type: 'text', valuePaths: ['Item', 'ItemNo', 'Description'] },
        { name: 'quantity', label: 'Quantity', type: 'number', valuePaths: ['Quantity'] },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          valuePaths: ['Priority'],
          options: ['Low', 'Medium', 'High', 'Critical'].map((value) => ({ label: value, value })),
        },
        { name: 'location', label: 'Location', type: 'text', valuePaths: ['Location'] },
        { name: 'odometer', label: 'Current odometer (vehicle only)', type: 'number', valuePaths: ['Odometer', 'CurrentOdometer'] },
        { name: 'lastServiceOdometer', label: 'Last service odometer (vehicle only)', type: 'number', valuePaths: ['LastServiceOdometer'] },
        { name: 'issueDescription', label: 'Issue description', type: 'textarea', valuePaths: ['Purpose', 'IssueDescription'] },
        { name: 'attachments', label: 'Photos or documents', type: 'files' },
      ]}
      moduleConfig={{ module: 'maintenance', entity: 'selfServiceMaintenanceRequests' }}
      detailFields={[
        { label: 'Request No.', paths: ['request.requestNo'] },
        { label: 'Request Date', paths: ['payload.RequestDate', 'payload.Request_Date', 'payload.Date'], format: 'date' },
        { label: 'FA Tag / Vehicle No.', paths: ['payload.VehicleNo', 'payload.Vehicle_No', 'payload.FATagNumber'] },
        { label: 'Item / Service', paths: ['payload.Item', 'payload.ItemNo', 'payload.Description'] },
        { label: 'Quantity', paths: ['payload.Quantity'] },
        { label: 'Location', paths: ['payload.Location'] },
        { label: 'Priority', paths: ['payload.Priority'] },
        { label: 'Current Odometer', paths: ['payload.Odometer', 'payload.CurrentOdometer'] },
        { label: 'Next Maintenance KM', paths: ['payload.NextMaintenanceKM', 'payload.Next_Maintenance_KM'] },
        { label: 'Issue Description', paths: ['payload.Purpose', 'payload.IssueDescription'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      businessRules={[
        'Fixed-asset maintenance requires an FA tag; vehicle service requires a vehicle and current odometer.',
        'Vehicle service requests are accepted only after 5,000 km from the previous service reading.',
        'Priority, location, item, quantity and problem description are included in the request.',
      ]}
    />
  )
}
