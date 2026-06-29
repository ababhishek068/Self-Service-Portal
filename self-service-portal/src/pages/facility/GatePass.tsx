import { useNavigate } from 'react-router-dom'
import { gatePassSources, listGatePasses, type GatePassSource } from '@/api/endpoints/gatePass'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { DataTableColumn } from '@/components/shared/DataTable'
import { gatePassSchema } from '@/schemas/requestSchemas'
import type { PortalRequest } from '@/types/erp.types'
import { formatDate } from '@/utils/formatters'

const creationRoutes: Record<GatePassSource, string> = {
  storeIssue: '/facility/store-requisition?new=1&fromGatePass=storeIssue',
  transferOrder: '/facility/transfer-order?new=1&fromGatePass=transferOrder',
  assetTransfer: '/facility/vehicle-transfer?new=1&fromGatePass=assetTransfer',
}

function payloadValue(row: PortalRequest, keys: string[], fallback = '-') {
  for (const key of keys) {
    const value = row.payload?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

export function GatePass({ source }: { source: GatePassSource }) {
  const navigate = useNavigate()
  const activeSource = gatePassSources.find((item) => item.value === source) ?? gatePassSources[0]
  const listColumns: DataTableColumn<PortalRequest>[] = [
    { id: 'number', header: 'No.', cell: (row) => row.requestNo },
    {
      id: 'dateCreated',
      header: 'Date Created',
      cell: (row) => formatDate(payloadValue(row, ['DateCreated', 'Date_Created'], row.createdAt)),
    },
    { id: 'employee', header: 'Employee', cell: (row) => payloadValue(row, ['EmployeeName'], row.makerName || row.makerEmployeeNo) },
    { id: 'department', header: 'Department', cell: (row) => payloadValue(row, ['DistrictDepartmentName'], row.departmentName || row.departmentCode) },
    { id: 'sector', header: 'Sector', cell: (row) => payloadValue(row, ['SectorName']) },
    { id: 'from', header: 'From', cell: (row) => payloadValue(row, ['FromLocation']) },
    { id: 'to', header: 'To', cell: (row) => payloadValue(row, ['ToLocation']) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]
  const lineColumns = source === 'storeIssue'
    ? [
        { label: 'Type', paths: ['type', 'Type'] },
        { label: 'Issuing Store', paths: ['issuingStore', 'IssuingStore'] },
        { label: 'No.', paths: ['itemNo', 'ItemNo', 'LineNo'] },
        { label: 'Description', paths: ['description', 'Description'] },
        { label: 'Quantity Requested', paths: ['quantityRequested', 'QuantityRequested'] },
        { label: 'Quantity Issued', paths: ['quantityIssued', 'QuantityIssued'] },
      ]
    : [
        { label: 'Item No.', paths: ['itemNo', 'ItemNo'] },
        { label: 'Description', paths: ['description', 'Description'] },
        { label: 'Quantity', paths: ['quantity', 'Quantity'] },
        { label: 'Unit of Measure', paths: ['unitOfMeasure', 'UnitofMeasure'] },
        { label: 'Quantity Shipped', paths: ['quantityShipped', 'QuantityShipped'] },
        { label: 'Quantity Received', paths: ['quantityReceived', 'QuantityReceived'] },
      ]

  return (
    <RequestFormPage
      title={activeSource.label}
      description={activeSource.description}
      schema={gatePassSchema}
      queryKey={['facility', 'gate-pass', source]}
      listRequests={() => listGatePasses(source)}
      createRequest={async () => undefined}
      source="Facility requirements workbook"
      defaultValues={{
        gatePassType: 'Returnable',
        assetTagNumber: '',
        destination: '',
        issueDate: '',
        returnDate: '',
        reason: '',
        attachments: [],
      }}
      fields={[]}
      listOnly
      listActions={(
        <PortalNewButton
          label={`New ${activeSource.singularLabel}`}
          onClick={() => navigate(creationRoutes[source])}
        />
      )}
      listColumns={listColumns}
      emptyListText={`*** No ${activeSource.label} Found ***`}
      refetchOnMount="always"
      cancelStatuses={['Pending Approval']}
      moduleConfig={{ module: 'gatePass', entity: 'selfServiceGatePasses' }}
      detailFields={[
        { label: 'Gate Pass No.', paths: ['request.requestNo'] },
        { label: 'Date Created', paths: ['payload.DateCreated', 'payload.Date_Created', 'request.createdAt'], format: 'date' },
        { label: 'Employee', paths: ['payload.EmployeeName', 'request.makerName', 'request.makerEmployeeNo'] },
        { label: 'Returned Status', paths: ['payload.Returned'], format: 'returned' },
        { label: 'Sector', paths: ['payload.SectorName'] },
        { label: 'Department', paths: ['payload.DistrictDepartmentName', 'request.departmentName'] },
        { label: 'From Location', paths: ['payload.FromLocation'] },
        { label: 'To Location', paths: ['payload.ToLocation'] },
        { label: 'Description', paths: ['payload.Description', 'request.title'] },
        { label: 'Comment', paths: ['payload.Comment'] },
        { label: 'Transfer No.', paths: ['payload.TransferNo', 'payload.Transfer_No'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      detailLineLabel="Gate Pass Lines"
      detailLineColumns={lineColumns}
      hideDetailAttachments
      businessRules={[
        `Create a ${activeSource.singularLabel.toLowerCase()} source request; Business Central generates the Gate Pass in this section.`,
        'Open gate passes can be sent for approval from the detail screen.',
      ]}
    />
  )
}
