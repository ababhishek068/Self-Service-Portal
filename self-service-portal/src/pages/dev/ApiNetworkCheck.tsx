import { useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { fetchCurrentUser } from '@/api/endpoints/auth'
import { listApprovals } from '@/api/endpoints/approvals'
import { listAttendanceRecords } from '@/api/endpoints/attendance'
import { listPolicyDocuments } from '@/api/endpoints/documents'
import { getDashboardSummary, getGatePassLogReport, getLeaveBalanceReport, getStoreUsageReport, listItemMaster } from '@/api/endpoints/employee'
import { listHodStaffOnLeave, listHodTeamRequests } from '@/api/endpoints/hod'
import { fetchLeaveTypes, fetchRelievers, getLeaveBalance, listLeaveRequests } from '@/api/endpoints/leave'
import { getPayslip } from '@/api/endpoints/payroll'
import { getEmployeeProfileDetails } from '@/api/endpoints/profile'
import { listPerformanceReviews } from '@/api/endpoints/performance'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { listWorkTickets } from '@/api/endpoints/workTickets'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { usePermissions } from '@/hooks/usePermissions'

interface CheckResult {
  label: string
  method: string
  url: string
  status: 'pass' | 'fail' | 'skip' | 'expected'
  detail: string
  ms: number
}

async function runCheck(
  label: string,
  method: string,
  url: string,
  fn: () => Promise<unknown>,
  expectForbidden = false,
): Promise<CheckResult> {
  const start = performance.now()
  try {
    await fn()
    const ms = Math.round(performance.now() - start)
    if (expectForbidden) {
      return { label, method, url, status: 'fail', detail: 'Expected 403 but request succeeded', ms }
    }
    return { label, method, url, status: 'pass', detail: 'OK', ms }
  } catch (err: unknown) {
    const ms = Math.round(performance.now() - start)
    const status = (err as { status?: number })?.status
    const message = err instanceof Error ? err.message : 'Request failed'
    if (expectForbidden && status === 403) {
      return { label, method, url, status: 'expected', detail: '403 — correct for staff role', ms }
    }
    return { label, method, url, status: 'fail', detail: message, ms }
  }
}

export function ApiNetworkCheck() {
  const { canApprove, isHOD } = usePermissions()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<CheckResult[]>([])

  const runAll = async () => {
    setRunning(true)
    const checks: Array<() => Promise<CheckResult>> = [
      () => runCheck('Current user', 'GET', '/api/auth/me', fetchCurrentUser),
      () => runCheck('Dashboard summary', 'GET', '/api/dashboard/summary', getDashboardSummary),
      () => runCheck('Leave types', 'GET', '/api/leave/types', fetchLeaveTypes),
      () => runCheck('Leave relievers', 'GET', '/api/leave/relievers', fetchRelievers),
      () => runCheck('Leave balance', 'GET', '/api/leave/balance/ANNUAL', () => getLeaveBalance('ANNUAL')),
      () => runCheck('Leave list', 'GET', '/api/leave', listLeaveRequests),
      () => runCheck('Imprest requests', 'GET', '/api/requests?module=imprest', () => listModuleRequests({ module: 'imprest', entity: 'selfServiceImprestRequests' })),
      () => runCheck('Staff claims', 'GET', '/api/requests?module=staffClaim', () => listModuleRequests({ module: 'staffClaim', entity: 'selfServiceStaffClaims' })),
      () => runCheck('Petty cash', 'GET', '/api/requests?module=pettyCash', () => listModuleRequests({ module: 'pettyCash', entity: 'selfServicePettyCashRequests' })),
      () => runCheck('Purchase requisitions', 'GET', '/api/requests?module=purchaseRequisition', () => listModuleRequests({ module: 'purchaseRequisition', entity: 'selfServicePurchaseRequisitions' })),
      () => runCheck('Store requisitions', 'GET', '/api/requests?module=storeRequisition', () => listModuleRequests({ module: 'storeRequisition', entity: 'selfServiceStoreRequisitions' })),
      () => runCheck('Attendance', 'GET', '/api/attendance', listAttendanceRecords),
      () => runCheck('Profile details', 'GET', '/api/profile/details', getEmployeeProfileDetails),
      () => runCheck('Payslip', 'GET', '/api/payroll/payslip?year=2026&month=March', () => getPayslip('2026', 'March')),
      () => runCheck('Documents', 'GET', '/api/documents', listPolicyDocuments),
      () => runCheck('Performance', 'GET', '/api/performance', listPerformanceReviews),
      () => runCheck('Work tickets', 'GET', '/api/work-tickets', listWorkTickets),
      () => runCheck('Item master', 'GET', '/api/items', listItemMaster),
      () => runCheck('Leave balance report', 'GET', '/api/reports/leave-balance', getLeaveBalanceReport),
      () => runCheck('Store usage report', 'GET', '/api/reports/store-usage', getStoreUsageReport),
      () => runCheck('Gate pass log', 'GET', '/api/reports/gate-pass-log', getGatePassLogReport),
      () =>
        runCheck(
          'Approvals queue',
          'GET',
          '/api/approvals?type=pending',
          () => listApprovals('pending'),
          !canApprove,
        ),
      () =>
        runCheck(
          'HOD team requests',
          'GET',
          '/api/hod/team-requests',
          listHodTeamRequests,
          !isHOD,
        ),
      () =>
        runCheck(
          'HOD staff on leave',
          'GET',
          '/api/hod/staff-on-leave',
          listHodStaffOnLeave,
          !isHOD,
        ),
      () =>
        runCheck('Health', 'GET', '/api/health', async () => {
          const base = env.AUTH_API_URL?.replace(/\/$/, '') ?? ''
          const res = await fetch(`${base}/api/health`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        }),
    ]

    const next: CheckResult[] = []
    for (const check of checks) {
      next.push(await check())
      setResults([...next])
    }
    setRunning(false)
  }

  const passed = results.filter((r) => r.status === 'pass' || r.status === 'expected').length
  const failed = results.filter((r) => r.status === 'fail').length

  return (
    <PageWrapper
      title="API Network Check"
      description="Fires every backend call the portal uses. Open DevTools → Network → Fetch/XHR before clicking Run."
    >
      <div className="portal-panel space-y-4 p-4 sm:p-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">How to watch in Inspect → Network</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Open <strong>http://localhost:5173</strong> and log in (e.g. HB-00123 / Secret@123).</li>
            <li>Press <strong>F12</strong> → <strong>Network</strong> tab → filter <strong>Fetch/XHR</strong>.</li>
            <li>Navigate to <strong>/dev/api-check</strong> (this page).</li>
            <li>Click <strong>Run all API checks</strong> — you should see requests to <code>localhost:4000</code>.</li>
          </ol>
          <p className="mt-2 text-xs text-blue-700">
            Backend: {env.AUTH_API_URL || '(not set — required)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void runAll()} disabled={running}>
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running checks…' : 'Run all API checks'}
          </Button>
          {results.length > 0 ? (
            <span className="text-sm text-slate-600">
              {passed} passed · {failed} failed · {results.length} total
            </span>
          ) : null}
        </div>

        {results.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Check</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.label} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <span
                        className={
                          row.status === 'pass'
                            ? 'font-semibold text-green-700'
                            : row.status === 'expected'
                              ? 'font-semibold text-amber-700'
                              : 'font-semibold text-red-700'
                        }
                      >
                        {row.status === 'pass' ? 'PASS' : row.status === 'expected' ? 'EXPECTED' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{row.label}</td>
                    <td className="px-3 py-2">{row.method}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.url}</td>
                    <td className="px-3 py-2">{row.ms}ms</td>
                    <td className="px-3 py-2 text-slate-600">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </PageWrapper>
  )
}
