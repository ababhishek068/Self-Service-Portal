import { useQuery } from '@tanstack/react-query'
import { listHodStaffOnLeave, type HodStaffLeaveRow } from '@/api/endpoints/hod'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

const columns: DataTableColumn<HodStaffLeaveRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'leaveType', header: 'Leave Type', cell: (row) => row.leaveType },
  { id: 'from', header: 'From', cell: (row) => row.from },
  { id: 'to', header: 'To', cell: (row) => row.to },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function StaffOnLeave() {
  const query = useQuery({ queryKey: ['hod', 'staff-on-leave'], queryFn: listHodStaffOnLeave })

  return (
    <PageWrapper title="Staff on Leave" description="Members of your department currently on approved leave.">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading staff leave...' : 'No department staff are currently on leave'}
        compact
      />
    </PageWrapper>
  )
}
