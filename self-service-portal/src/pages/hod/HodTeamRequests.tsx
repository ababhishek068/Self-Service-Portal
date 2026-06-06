import { useQuery } from '@tanstack/react-query'
import { listHodTeamRequests, type HodTeamRequestRow } from '@/api/endpoints/hod'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

const columns: DataTableColumn<HodTeamRequestRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'type', header: 'Request Type', cell: (row) => row.requestType },
  { id: 'date', header: 'Date', cell: (row) => row.date },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function HodTeamRequests() {
  const query = useQuery({ queryKey: ['hod', 'team-requests'], queryFn: listHodTeamRequests })

  return (
    <PageWrapper title="Team Requests">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading team requests...' : 'No team requests found'}
      />
    </PageWrapper>
  )
}
