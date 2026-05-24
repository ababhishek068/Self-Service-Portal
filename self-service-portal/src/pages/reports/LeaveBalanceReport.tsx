import { useQuery } from '@tanstack/react-query'
import { getLeaveBalanceReport } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'

interface LeaveBalanceRow {
  employeeNo: string
  name: string
  annualBalance: number
  used: number
  department: string
}

export function LeaveBalanceReport() {
  const report = useQuery({ queryKey: ['reports', 'leave-balance'], queryFn: getLeaveBalanceReport })
  const columns: DataTableColumn<LeaveBalanceRow>[] = [
    { id: 'employeeNo', header: 'Employee no', cell: (row) => row.employeeNo, sortValue: (row) => row.employeeNo },
    { id: 'name', header: 'Name', cell: (row) => row.name, sortValue: (row) => row.name },
    { id: 'department', header: 'Department', cell: (row) => row.department, sortValue: (row) => row.department },
    { id: 'annualBalance', header: 'Annual balance', cell: (row) => row.annualBalance, sortValue: (row) => row.annualBalance },
    { id: 'used', header: 'Used', cell: (row) => row.used, sortValue: (row) => row.used },
  ]

  return (
    <PageWrapper title="Leave Balance Report" description="Employee leave balances with used days and remaining allocation.">
      <Card>
        <CardHeader>
          <CardTitle>Leave balances</CardTitle>
          <CardDescription>Balances are read from ERP leave management.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable rows={(report.data ?? []) as LeaveBalanceRow[]} columns={columns} getRowId={(row) => row.employeeNo} />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
