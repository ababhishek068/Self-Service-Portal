import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApprovals } from '@/hooks/useApprovals'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { ApprovalQueueItem } from '@/types/erp.types'
import type { ApprovalListType } from '@/types/approval'

interface ApprovalsListProps {
  type: ApprovalListType
  title: string
  emptyTitle?: string
}

export function ApprovalsList({ type, title, emptyTitle }: ApprovalsListProps) {
  const approvals = useApprovals(type)
  const actionLabel = type === 'pending' ? 'Open' : 'View'

  const columns: DataTableColumn<ApprovalQueueItem>[] = [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'module', header: 'Module', cell: (row) => row.module },
    { id: 'maker', header: 'Maker', cell: (row) => row.makerName },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.submittedAt) },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => (
        <Button asChild variant="action" size="sm" className="rounded-full">
          <Link to={`/approvals/${row.id}`}>
            <Eye className="h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <PageWrapper title={title}>
      {approvals.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          rows={approvals.data ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          emptyTitle={emptyTitle}
          compact
        />
      )}
    </PageWrapper>
  )
}
