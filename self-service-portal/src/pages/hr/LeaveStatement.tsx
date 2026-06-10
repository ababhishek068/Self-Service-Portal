import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listLeaveRequests } from '@/api/endpoints/leave'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { leaveTypes } from '@/data/leaveTypes'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatters'

interface StatementRow {
  id: string
  leaveType: string
  leaveTypeCode?: string
  startDate: string
  endDate: string
  days: number
  balance: number
  status: string
}

export function LeaveStatement() {
  const { employee } = useAuth()
  const [leaveType, setLeaveType] = useState('')
  const leaveQuery = useQuery({ queryKey: ['hr', 'leave-list'], queryFn: listLeaveRequests })

  const columns: DataTableColumn<StatementRow>[] = [
    { id: 'type', header: 'Leave Type', cell: (row) => row.leaveType },
    { id: 'start', header: 'Start Date', cell: (row) => formatDate(row.startDate) },
    { id: 'end', header: 'End Date', cell: (row) => formatDate(row.endDate) },
    { id: 'days', header: 'Days', cell: (row) => row.days },
    { id: 'balance', header: 'Balance After', cell: (row) => row.balance },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  const liveRows: StatementRow[] =
    leaveQuery.data?.map((row) => ({
      id: row.ApplicationCode,
      leaveType: row.LeaveType,
      leaveTypeCode: row.LeaveTypeCode,
      startDate: row.StartDate ?? '',
      endDate: row.EndDate ?? row.StartDate ?? '',
      days: row.DaysApplied ?? 0,
      balance: employee?.leaveBalance ?? 0,
      status: row.Status,
    })) ?? []
  const rows = liveRows.filter((row) => !leaveType || row.leaveType === leaveType || row.leaveTypeCode === leaveType)

  return (
    <PageWrapper title="Leave Statement" showPageHeading={false}>
      <PortalFormCard title="Leave Statement">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                id="leaveType"
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                options={leaveTypes.map((value) => ({
                  label: value,
                  value: value === '--select--' ? '' : value,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <p className="flex h-10 items-center text-sm font-medium text-slate-700">
                {employee?.employeeNo} — {employee?.displayName}
              </p>
            </div>
          </div>
        </div>
      </PortalFormCard>

      <div className="mt-6">
        <h2 className="portal-page-title mb-3 text-base font-semibold">
          Leave Statement {leaveType ? `— ${leaveType}` : ''}
        </h2>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          compact
          emptyTitle={leaveQuery.isLoading ? 'Loading leave statement...' : 'No leave statement records found'}
        />
        {liveRows.length > 0 ? <p className="mt-2 text-xs text-slate-500">{liveRows.length} live record(s).</p> : null}
      </div>
    </PageWrapper>
  )
}
