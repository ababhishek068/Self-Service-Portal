import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CircleX,
  ClipboardCheck,
  ClipboardCopy,
  Database,
  Home,
  ReceiptText,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getDashboardSummary } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { PortalRequest } from '@/types/erp.types'

interface DashboardTile {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Tailwind classes for the tile background gradient. */
  tone: string
  /** Tailwind classes for the inner icon chip. */
  chip: string
}

const tiles: DashboardTile[] = [
  {
    id: 'pendingApprovals',
    label: 'Pending Approval',
    href: '/approvals',
    icon: ClipboardCopy,
    tone: 'from-rose-500 via-rose-500 to-rose-600',
    chip: 'bg-white/20',
  },
  {
    id: 'approvedDocuments',
    label: 'Approved Documents',
    href: '/approvals/approved',
    icon: ClipboardCheck,
    tone: 'from-sky-500 via-sky-500 to-blue-600',
    chip: 'bg-white/20',
  },
  {
    id: 'rejectedDocuments',
    label: 'Rejected Documents',
    href: '/approvals/rejected',
    icon: CircleX,
    tone: 'from-emerald-500 via-emerald-500 to-emerald-600',
    chip: 'bg-white/20',
  },
  {
    id: 'leaveApplications',
    label: 'Leave Applications',
    href: '/hr/leave-request',
    icon: Home,
    tone: 'from-amber-400 via-amber-500 to-amber-600',
    chip: 'bg-white/20',
  },
  {
    id: 'staffClaims',
    label: 'Staff Claims',
    href: '/finance/staff-claim',
    icon: BadgeCheck,
    tone: 'from-emerald-700 via-emerald-700 to-emerald-800',
    chip: 'bg-white/20',
  },
  {
    id: 'imprestRequisitions',
    label: 'Imprest Requisitions',
    href: '/finance/imprest',
    icon: Banknote,
    tone: 'from-slate-500 via-slate-600 to-slate-700',
    chip: 'bg-white/20',
  },
  {
    id: 'imprestSurrenders',
    label: 'Imprest Surrenders',
    href: '/finance/imprest-surrender',
    icon: ReceiptText,
    tone: 'from-rose-500 via-rose-500 to-rose-600',
    chip: 'bg-white/20',
  },
  {
    id: 'purchaseRequisitions',
    label: 'Purchase Requisitions',
    href: '/facility/purchase-requisition',
    icon: ShoppingCart,
    tone: 'from-amber-700 via-amber-800 to-yellow-900',
    chip: 'bg-white/20',
  },
  {
    id: 'storeRequisitions',
    label: 'Store Requisitions',
    href: '/facility/store-requisition',
    icon: Database,
    tone: 'from-pink-500 via-pink-600 to-pink-700',
    chip: 'bg-white/20',
  },
]

export function Dashboard() {
  const { employee } = useAuth()
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary })
  const firstName = employee?.displayName?.split(' ')[0] ?? 'there'
  const data = (summary.data ?? {}) as Record<string, number | undefined>

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
          <div className="portal-welcome animate-page-in-subtle flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <Sparkles className="h-4 w-4 text-[var(--portal-orange)]" />
                Welcome back
              </p>
              <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-[var(--portal-navy)] sm:text-2xl">
                Hi {firstName}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Welcome to Hijra Bank&apos;s Self Service Portal — {new Date().getFullYear()} Summary
              </p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--portal-navy)] to-[var(--portal-orange)] text-2xl font-bold text-white shadow-lg sm:flex">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="portal-stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {tiles.map((tile) => {
              const Icon = tile.icon
              const value = data[tile.id] ?? 0
              return (
                <Link
                  key={tile.id}
                  to={tile.href}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br ${tile.tone} p-3 text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:gap-4 sm:p-4`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tile.chip} ring-1 ring-white/30 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold leading-tight sm:text-3xl">{value}</p>
                    <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-white/85 sm:text-xs">
                      {tile.label}
                    </p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-1 sm:block" />
                </Link>
              )
            })}
          </div>

          <div className="portal-panel animate-page-in-subtle p-3 sm:p-5" style={{ animationDelay: '120ms' }}>
            <h2 className="portal-page-title mb-3 text-base font-semibold italic sm:mb-4 sm:text-lg">Recent Activity</h2>
            <DataTable
              rows={summary.data?.recentActivity ?? []}
              columns={activityColumns}
              getRowId={(row) => row.id}
              compact
            />
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
