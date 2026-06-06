import { useQuery } from '@tanstack/react-query'
import { listWorkTickets, type WorkTicketRow } from '@/api/endpoints/workTickets'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

const columns: DataTableColumn<WorkTicketRow>[] = [
  { id: 'ticketNo', header: 'Ticket No.', cell: (row) => row.ticketNo },
  { id: 'vehicle', header: 'Vehicle', cell: (row) => row.vehicle },
  { id: 'driver', header: 'Driver', cell: (row) => row.driver },
  { id: 'date', header: 'Date', cell: (row) => row.date },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function WorkTickets() {
  const query = useQuery({ queryKey: ['facility', 'work-tickets'], queryFn: listWorkTickets })

  return (
    <PageWrapper title="Work Tickets" description="Vehicle work tickets raised against your transport requisitions.">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading work tickets...' : 'No work tickets found'}
        compact
      />
    </PageWrapper>
  )
}
