import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { listHodStaffOnLeave, type HodStaffLeaveRow } from '@/api/endpoints/hod'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Input } from '@/components/ui/input'

const columns: DataTableColumn<HodStaffLeaveRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'leaveType', header: 'Leave Type', cell: (row) => row.leaveType },
  { id: 'from', header: 'From', cell: (row) => row.from },
  { id: 'to', header: 'To', cell: (row) => row.to },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function StaffOnLeave() {
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['hod', 'staff-on-leave'], queryFn: listHodStaffOnLeave })

  const filteredRows = useMemo(() => {
    const rows = query.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [row.employee, row.leaveType, row.from, row.to, row.status].some((value) =>
        String(value).toLowerCase().includes(term),
      ),
    )
  }, [query.data, search])

  return (
    <PageWrapper title="Staff on Leave" description="Members of your department currently on approved leave.">
      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff on leave..."
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading staff leave...' : 'No department staff are currently on leave'}
        compact
      />
    </PageWrapper>
  )
}
