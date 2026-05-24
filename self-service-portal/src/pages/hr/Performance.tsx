import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'

interface PerformanceRow {
  id: string
  employeeName: string
  period: string
  supervisor: string
  status: string
}

const columns: DataTableColumn<PerformanceRow>[] = [
  { id: 'no', header: 'No.', cell: (row) => row.id },
  { id: 'name', header: 'Employee Name', cell: (row) => row.employeeName },
  { id: 'period', header: 'Period.', cell: (row) => row.period },
  { id: 'supervisor', header: 'Supervisor', cell: (row) => row.supervisor },
  { id: 'status', header: 'Status', cell: (row) => row.status },
]

export function Performance() {
  return (
    <PageWrapper title="Performance List">
      <DataTable rows={[]} columns={columns} getRowId={() => 'empty'} />
    </PageWrapper>
  )
}
