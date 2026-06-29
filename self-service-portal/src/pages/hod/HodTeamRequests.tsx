import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { listHodTeamRequests, type HodTeamRequestRow } from '@/api/endpoints/hod'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Input } from '@/components/ui/input'

const columns: DataTableColumn<HodTeamRequestRow>[] = [
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'employeeNo', header: 'Employee No.', cell: (row) => row.employeeNo },
  { id: 'type', header: 'Job Title', cell: (row) => row.requestType },
  { id: 'date', header: 'Employment Date', cell: (row) => row.date },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function HodTeamRequests() {
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['hod', 'team-requests'], queryFn: listHodTeamRequests })

  const filteredRows = useMemo(() => {
    const rows = query.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [row.employee, row.requestType, row.date, row.status].some((value) =>
        String(value).toLowerCase().includes(term),
      ),
    )
  }, [query.data, search])

  return (
    <PageWrapper title="Department Staff" description="Active employees in your department.">
      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search department staff..."
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading department staff...' : 'No department staff found'}
      />
    </PageWrapper>
  )
}
