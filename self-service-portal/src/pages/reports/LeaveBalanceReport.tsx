import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLeaveBalanceReport } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'

interface LeaveTypeBalance {
  code: string
  label: string
  balance: number
  used: number
}

interface LeaveBalanceRow {
  employeeNo: string
  name: string
  department: string
  leaveTypes: LeaveTypeBalance[]
}

export function LeaveBalanceReport() {
  const report = useQuery({ queryKey: ['reports', 'leave-balance'], queryFn: getLeaveBalanceReport })
  const rows = (report.data ?? []) as LeaveBalanceRow[]

  const leaveTypeColumns = useMemo(() => rows[0]?.leaveTypes ?? [], [rows])

  const columns = useMemo<DataTableColumn<LeaveBalanceRow>[]>(() => {
    const base: DataTableColumn<LeaveBalanceRow>[] = [
      { id: 'employeeNo', header: 'Employee no', cell: (row) => row.employeeNo, sortValue: (row) => row.employeeNo },
      { id: 'name', header: 'Name', cell: (row) => row.name, sortValue: (row) => row.name },
      { id: 'department', header: 'Department', cell: (row) => row.department, sortValue: (row) => row.department },
    ]

    for (const leaveType of leaveTypeColumns) {
      base.push({
        id: `${leaveType.code}-balance`,
        header: `${leaveType.label} balance`,
        cell: (row) => row.leaveTypes.find((item) => item.code === leaveType.code)?.balance ?? 0,
        sortValue: (row) => row.leaveTypes.find((item) => item.code === leaveType.code)?.balance ?? 0,
      })
      base.push({
        id: `${leaveType.code}-used`,
        header: `${leaveType.label} used`,
        cell: (row) => row.leaveTypes.find((item) => item.code === leaveType.code)?.used ?? 0,
        sortValue: (row) => row.leaveTypes.find((item) => item.code === leaveType.code)?.used ?? 0,
      })
    }

    return base
  }, [leaveTypeColumns])

  return (
    <PageWrapper title="Leave Balance Report" description="Employee leave balances with used days and remaining allocation.">
      <Card>
        <CardHeader>
          <CardTitle>Leave balances</CardTitle>
          <CardDescription>Balances and used days are shown for every leave type in the catalog.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable rows={rows} columns={columns} getRowId={(row) => row.employeeNo} />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
