import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle2, Download, FileText } from 'lucide-react'
import { downloadLeaveStatement, fetchLeaveTypes, listLeaveRequests } from '@/api/endpoints/leave'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatters'
import { useToast } from '@/components/feedback/ToastProvider'

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
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const toast = useToast()
  const leaveQuery = useQuery({ queryKey: ['hr', 'leave-list'], queryFn: listLeaveRequests })
  const leaveTypesQuery = useQuery({ queryKey: ['hr', 'leave-types'], queryFn: fetchLeaveTypes })

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
  const generate = async () => {
    if (!leaveType) {
      setDownloadError('Select a leave type first.')
      return
    }
    setDownloading(true)
    setDownloadProgress(12)
    setDownloadError('')
    try {
      window.setTimeout(() => setDownloadProgress((value) => Math.max(value, 38)), 250)
      await downloadLeaveStatement(leaveType, setDownloadProgress)
      setDownloadProgress(100)
      toast.success('Your leave statement is ready in Downloads.', 'PDF downloaded')
      await new Promise((resolve) => window.setTimeout(resolve, 450))
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : 'Leave statement generation failed.')
      setDownloadProgress(0)
    } finally {
      setDownloading(false)
    }
  }

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
                placeholder="Select leave type"
                options={(leaveTypesQuery.data ?? []).map((type) => ({
                  label: type.description,
                  value: type.code,
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
          <div className="flex justify-center">
            <Button type="button" disabled={downloading} onClick={() => void generate()}>
              <Download className="h-4 w-4" />
              {downloading ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
          {downloading || downloadProgress === 100 ? (
            <div className="mx-auto w-full max-w-xl rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 p-4 shadow-sm" role="status" aria-live="polite">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--portal-navy)] text-white">
                  {downloadProgress === 100 ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5 animate-pulse" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {downloadProgress === 100 ? 'Download ready' : 'Preparing your leave statement'}
                  </p>
                  <p className="text-xs text-slate-500">{downloadProgress}% complete</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--portal-navy)] via-blue-500 to-[var(--portal-orange)] transition-[width] duration-500 ease-out" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          ) : null}
          {downloadError ? <p className="text-center text-sm text-red-600">{downloadError}</p> : null}
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
