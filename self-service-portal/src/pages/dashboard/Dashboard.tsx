import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Clock3, FileWarning, Sparkles, Umbrella } from 'lucide-react'
import { getDashboardSummary } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { PortalRequest } from '@/types/erp.types'

export function Dashboard() {
  const { employee } = useAuth()
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary })
  const firstName = employee?.displayName?.split(' ')[0] ?? 'there'

  const statCards = [
    { label: 'Pending approvals', value: summary.data?.pendingApprovals ?? 0, icon: ClipboardCheck },
    { label: 'Leave balance', value: `${summary.data?.leaveBalance ?? 0} days`, icon: Umbrella },
    { label: 'Open requests', value: summary.data?.openRequests ?? 0, icon: Clock3 },
    { label: 'Unresolved', value: summary.data?.unresolved ?? 0, icon: FileWarning },
  ]

  const activityColumns: DataTableColumn<PortalRequest>[] = [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'title', header: 'Request', cell: (row) => row.title },
    { id: 'date', header: 'Date', cell: (row) => formatDateTime(row.createdAt) },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageWrapper title="Dashboard">
      {summary.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="portal-welcome animate-page-in-subtle flex items-center justify-between gap-4 p-5">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Sparkles className="h-4 w-4 text-[var(--portal-orange)]" />
                Welcome back
              </p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--portal-navy)]">{firstName}</p>
              <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your requests today.</p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--portal-navy)] to-[var(--portal-orange)] text-2xl font-bold text-white shadow-lg sm:flex">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="portal-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="portal-card flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--portal-navy)]">{card.value}</p>
                </div>
                <div className="portal-card-icon">
                  <card.icon className="h-7 w-7 text-[var(--portal-navy)]" />
                </div>
              </div>
            ))}
          </div>

          <div className="portal-panel animate-page-in-subtle p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
            <h2 className="portal-page-title mb-4 text-lg font-semibold italic">Recent Activity</h2>
            <DataTable
              rows={summary.data?.recentActivity ?? []}
              columns={activityColumns}
              getRowId={(row) => row.id}
              compact
            />
          </div>

          <div className="flex flex-wrap gap-3 animate-page-in-subtle" style={{ animationDelay: '180ms' }}>
            <Link to="/hr/leave-request" className="portal-quick-action portal-quick-action--orange portal-btn-shine">
              Leave Requisition
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/approvals" className="portal-quick-action portal-quick-action--navy portal-btn-shine">
              Pending Approvals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
