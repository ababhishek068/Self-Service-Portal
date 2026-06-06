import { useQuery } from '@tanstack/react-query'
import { listPerformanceReviews, type PerformanceRow } from '@/api/endpoints/performance'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

const columns: DataTableColumn<PerformanceRow>[] = [
  { id: 'no', header: 'No.', cell: (row) => row.employeeNo },
  { id: 'name', header: 'Employee Name', cell: (row) => row.employeeName },
  { id: 'period', header: 'Period.', cell: (row) => row.period },
  { id: 'supervisor', header: 'Supervisor', cell: (row) => row.supervisorName || row.supervisorEmployeeNo || '—' },
  { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
]

export function Performance() {
  const query = useQuery({ queryKey: ['hr', 'performance'], queryFn: listPerformanceReviews })

  return (
    <PageWrapper title="Performance List">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle={query.isLoading ? 'Loading performance reviews...' : 'No performance reviews found'}
      />
    </PageWrapper>
  )
}
