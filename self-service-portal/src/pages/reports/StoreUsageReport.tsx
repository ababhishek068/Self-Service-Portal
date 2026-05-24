import { useQuery } from '@tanstack/react-query'
import { getStoreUsageReport } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'

interface StoreUsageRow {
  itemCode: string
  description: string
  issuedQty: number
  department: string
  month: string
}

export function StoreUsageReport() {
  const report = useQuery({ queryKey: ['reports', 'store-usage'], queryFn: getStoreUsageReport })
  const columns: DataTableColumn<StoreUsageRow>[] = [
    { id: 'itemCode', header: 'Item code', cell: (row) => row.itemCode, sortValue: (row) => row.itemCode },
    { id: 'description', header: 'Description', cell: (row) => row.description, sortValue: (row) => row.description },
    { id: 'issuedQty', header: 'Issued qty', cell: (row) => row.issuedQty, sortValue: (row) => row.issuedQty },
    { id: 'department', header: 'Department', cell: (row) => row.department, sortValue: (row) => row.department },
    { id: 'month', header: 'Month', cell: (row) => row.month, sortValue: (row) => row.month },
  ]

  return (
    <PageWrapper title="Store Usage Report" description="Inventory usage by item, department, and period.">
      <Card>
        <CardHeader>
          <CardTitle>Store usage</CardTitle>
          <CardDescription>Generated from posted store requisition source documents.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable rows={(report.data ?? []) as StoreUsageRow[]} columns={columns} getRowId={(row) => row.itemCode} />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
