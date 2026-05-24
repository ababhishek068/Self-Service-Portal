import { useQuery } from '@tanstack/react-query'
import { listPettyCashRequests } from '@/api/endpoints/pettyCash'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import type { PortalRequest } from '@/types/erp.types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export function PettyCashReplenishment() {
  const requestsQuery = useQuery({ queryKey: ['finance', 'petty-cash-replenishment'], queryFn: listPettyCashRequests })

  const columns: DataTableColumn<PortalRequest>[] = [
    { id: 'no', header: 'No.', cell: (row) => row.requestNo.replace(/\D/g, '').slice(-4) || row.requestNo },
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.createdAt) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'from', header: 'Received From', cell: () => 'hijra bank' },
    { id: 'account', header: 'Receiving Account', cell: () => 'Petty Cash- Hawa' },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
  ]

  return (
    <PageWrapper title="Petty Cash Replenishment" actions={<PortalNewButton label="New Request" />}>
      {requestsQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <DataTable rows={requestsQuery.data ?? []} columns={columns} getRowId={(row) => row.id} compact />
      )}
    </PageWrapper>
  )
}
