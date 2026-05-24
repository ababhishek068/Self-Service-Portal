import { useQuery } from '@tanstack/react-query'
import { getGatePassLogReport } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface GatePassLogRow {
  gatePassNo: string
  type: string
  assetTag: string
  destination: string
  returnDate: string
  status: string
}

export function GatePassLog() {
  const report = useQuery({ queryKey: ['reports', 'gate-pass-log'], queryFn: getGatePassLogReport })
  const columns: DataTableColumn<GatePassLogRow>[] = [
    { id: 'gatePassNo', header: 'Gate pass no', cell: (row) => row.gatePassNo, sortValue: (row) => row.gatePassNo },
    { id: 'type', header: 'Type', cell: (row) => row.type, sortValue: (row) => row.type },
    { id: 'assetTag', header: 'Asset tag', cell: (row) => row.assetTag, sortValue: (row) => row.assetTag },
    { id: 'destination', header: 'Destination', cell: (row) => row.destination, sortValue: (row) => row.destination },
    { id: 'returnDate', header: 'Return date', cell: (row) => row.returnDate, sortValue: (row) => row.returnDate },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} />, sortValue: (row) => row.status },
  ]

  return (
    <PageWrapper title="Gate Pass Log" description="Returnable and non-returnable gate pass movement log.">
      <Card>
        <CardHeader>
          <CardTitle>Gate pass log</CardTitle>
          <CardDescription>Generated from gate pass source documents and asset movement entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable rows={(report.data ?? []) as GatePassLogRow[]} columns={columns} getRowId={(row) => row.gatePassNo} />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
