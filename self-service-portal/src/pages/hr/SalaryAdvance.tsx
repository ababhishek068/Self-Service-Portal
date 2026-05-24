import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'

interface SalaryAdvanceRow {
  id: string
  no: string
  date: string
  reason: string
  status: string
  highlight?: boolean
}

const mockRows: SalaryAdvanceRow[] = [
  { id: '1', no: 'A00290', date: '2025-12-10', reason: 'Testing', status: 'Posted' },
  { id: '2', no: 'A00459', date: '2025-12-15', reason: 'trvel', status: 'Pending Approval', highlight: true },
  { id: '3', no: 'A00235', date: '2025-12-18', reason: '', status: 'Cancelled' },
]

export function SalaryAdvance() {
  const [rows] = useState(mockRows)
  const [selectedId, setSelectedId] = useState<string | null>('2')

  const columns: DataTableColumn<SalaryAdvanceRow>[] = [
    {
      id: 'no',
      header: 'No.',
      cell: (row) => (
        <Link to={`/hr/salary-advance/${row.no}`} className="text-[var(--portal-navy)] underline" onClick={() => setSelectedId(row.id)}>
          {row.no}
        </Link>
      ),
    },
    { id: 'date', header: 'Date', cell: (row) => row.date },
    { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageWrapper title="Salary Advance" actions={<PortalNewButton label="New Request" />}>
      <DataTable rows={rows} columns={columns} getRowId={(row) => row.id} selectedRowId={selectedId ?? undefined} />
      <p className="mt-4 text-center">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/hr/salary-advance/A00235">View request details</Link>
        </Button>
      </p>
    </PageWrapper>
  )
}
