import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface WorkTicketRow {
  id: string
  ticketNo: string
  vehicle: string
  driver: string
  date: string
  status: string
}

const columns: DataTableColumn<WorkTicketRow>[] = [
  { id: 'ticketNo', header: 'Ticket No.', cell: (row) => row.ticketNo },
  { id: 'vehicle', header: 'Vehicle', cell: (row) => row.vehicle },
  { id: 'driver', header: 'Driver', cell: (row) => row.driver },
  { id: 'date', header: 'Date', cell: (row) => row.date },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function WorkTickets() {
  return (
    <PageWrapper title="Work Tickets" description="Vehicle work tickets raised against your transport requisitions.">
      <DataTable rows={[]} columns={columns} getRowId={() => 'empty'} compact />
    </PageWrapper>
  )
}
