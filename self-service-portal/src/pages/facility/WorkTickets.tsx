import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
import {
  deleteWorkTicketLine,
  getWorkTicket,
  listWorkTickets,
  type WorkTicketLine,
  type WorkTicketRow,
} from '@/api/endpoints/workTickets'
import { useConfirm } from '@/components/feedback/ConfirmProvider'
import { useToast } from '@/components/feedback/ToastProvider'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'

const columns: DataTableColumn<WorkTicketRow>[] = [
  { id: 'ticketNo', header: 'Ticket No.', cell: (row) => row.ticketNo },
  { id: 'previous', header: 'Previous Ticket No.', cell: (row) => row.previousTicketNo },
  { id: 'gkNo', header: 'GK No.', cell: (row) => row.gkNo },
  { id: 'type', header: 'Type', cell: (row) => row.type },
  { id: 'department', header: 'Department', cell: (row) => row.department },
]

export function WorkTickets() {
  const [selectedNo, setSelectedNo] = useState('')
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const toast = useToast()
  const query = useQuery({ queryKey: ['facility', 'work-tickets'], queryFn: listWorkTickets })
  const detailQuery = useQuery({
    queryKey: ['facility', 'work-tickets', selectedNo],
    queryFn: () => getWorkTicket(selectedNo),
    enabled: Boolean(selectedNo),
  })
  const deleteMutation = useMutation({
    mutationFn: (lineNo: string) => deleteWorkTicketLine(selectedNo, lineNo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['facility', 'work-tickets', selectedNo] })
      toast.success('Work-ticket line deleted')
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not delete the line', 'Delete failed'),
  })

  const removeLine = async (line: WorkTicketLine) => {
    const yes = await confirm({
      title: 'Delete work-ticket line',
      message: 'Are you sure you want to delete this line?',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (yes) deleteMutation.mutate(line.lineNo)
  }

  if (selectedNo) {
    const ticket = detailQuery.data
    const lineColumns: DataTableColumn<WorkTicketLine>[] = [
      { id: 'driver', header: 'Driver Name', cell: (row) => row.driverName },
      { id: 'from', header: 'Departure From', cell: (row) => row.departureFrom },
      { id: 'destination', header: 'Destination', cell: (row) => row.destination },
      { id: 'date', header: 'Work Date', cell: (row) => row.workDate },
      { id: 'officer', header: 'Authorizing Officer', cell: (row) => row.authorizingOfficerName },
      ...(ticket?.status === 'Open'
        ? [{
            id: 'action',
            header: 'Action',
            cell: (row: WorkTicketLine) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                disabled={deleteMutation.isPending}
                onClick={() => void removeLine(row)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ),
          }]
        : []),
    ]
    return (
      <PageWrapper title="Work Ticket Details">
        <Button type="button" variant="ghost" onClick={() => setSelectedNo('')}>
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Button>
        {ticket ? (
          <>
            <div className="portal-card my-4 grid gap-3 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Ticket No.</p><p className="font-semibold">{ticket.ticketNo}</p></div>
              <div><p className="text-xs text-slate-500">Previous Ticket</p><p className="font-semibold">{ticket.previousTicketNo || '-'}</p></div>
              <div><p className="text-xs text-slate-500">GK No.</p><p className="font-semibold">{ticket.gkNo || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Type</p><p className="font-semibold">{ticket.type || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Department</p><p className="font-semibold">{ticket.department || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={ticket.status} /></div>
            </div>
            <DataTable
              rows={ticket.lines}
              columns={lineColumns}
              getRowId={(row) => row.id}
              emptyTitle="No work-ticket lines found"
              compact
            />
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {detailQuery.isLoading ? 'Loading work ticket...' : 'Work ticket could not be loaded.'}
          </p>
        )}
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Work Tickets" description="Business Central work tickets.">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) => setSelectedNo(row.ticketNo)}
        emptyTitle={query.isLoading ? 'Loading work tickets...' : 'No work tickets found'}
        compact
      />
    </PageWrapper>
  )
}
