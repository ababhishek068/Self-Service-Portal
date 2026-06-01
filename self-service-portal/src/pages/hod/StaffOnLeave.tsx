import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface StaffLeaveRow {
  id: string
  employee: string
  leaveType: string
  from: string
  to: string
  status: string
}

const columns: DataTableColumn<StaffLeaveRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'leaveType', header: 'Leave Type', cell: (row) => row.leaveType },
  { id: 'from', header: 'From', cell: (row) => row.from },
  { id: 'to', header: 'To', cell: (row) => row.to },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function StaffOnLeave() {
  return (
    <PageWrapper
      title="Staff on Leave"
      description="Members of your department currently on approved leave."
    >
      <DataTable rows={[]} columns={columns} getRowId={() => 'empty'} compact />
    </PageWrapper>
  )
}
