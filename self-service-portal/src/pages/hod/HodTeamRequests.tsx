import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface TeamRow {
  id: string
  employee: string
  requestType: string
  date: string
  status: string
}

const columns: DataTableColumn<TeamRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'type', header: 'Request Type', cell: (row) => row.requestType },
  { id: 'date', header: 'Date', cell: (row) => row.date },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function HodTeamRequests() {
  return (
    <PageWrapper title="Team Requests">
      <DataTable rows={[]} columns={columns} getRowId={() => 'empty'} />
    </PageWrapper>
  )
}
