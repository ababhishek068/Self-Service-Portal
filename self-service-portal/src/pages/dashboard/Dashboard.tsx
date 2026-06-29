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
import { getToken, resolveApiBaseUrl } from '@/api/client/authClient'
import { BACKEND_NOT_CONFIGURED } from '@/api/requireBackend'
import { getDashboardSummary } from '@/api/endpoints/employee'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { approverRoles, type PortalRole } from '@/config/roles'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { PortalRequest } from '@/types/erp.types'
import { brand } from '@/config/brand'

interface DashboardTile {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Tailwind classes for the tile background gradient. */
  tone: string
  /** Tailwind classes for the inner icon chip. */
  chip: string
  /** When set, only show this tile to users holding one of these roles. */
  roles?: PortalRole[]
  /** Show this tile when backend says the user can approve, even if their role is staff. */
  requiresApproval?: boolean
}

const tiles: DashboardTile[] = [
  {
    id: 'pendingApprovals',
    label: 'Pending Approval',
    href: '/approvals',
    icon: ClipboardCopy,
    tone: 'from-rose-500 via-rose-500 to-rose-600',
    chip: 'bg-white/20',
    roles: approverRoles,
    requiresApproval: true,
  },
  {
    id: 'approvedDocuments',
    label: 'Approved Documents',
    href: '/approvals/approved',
    icon: ClipboardCheck,
    tone: 'from-sky-500 via-sky-500 to-blue-600',
    chip: 'bg-white/20',
    roles: approverRoles,
    requiresApproval: true,
  },
  {
    id: 'rejectedDocuments',
    label: 'Rejected Documents',
    href: '/approvals/rejected',
    icon: CircleX,
    tone: 'from-emerald-500 via-emerald-500 to-emerald-600',
    chip: 'bg-white/20',
    roles: approverRoles,
    requiresApproval: true,
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
  const { employee, isAuthenticated, bootstrapped } = useAuth()
  const { has, canApprove, primaryRoleLabel, capabilitySummary, quickLinks } = usePermissions()
  const apiBase = resolveApiBaseUrl()
  const canFetchSummary =
    bootstrapped && isAuthenticated && Boolean(apiBase) && Boolean(getToken())
  const summary = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    enabled: canFetchSummary,
  })
  const firstName = employee?.displayName?.split(' ')[0] ?? 'there'
  const data = summary.data ?? null
  const tileValues = (data ?? {}) as Record<string, number | undefined>
  const summaryError =
    summary.error instanceof Error
      ? summary.error.message
      : !apiBase
        ? BACKEND_NOT_CONFIGURED
        : null
  const visibleTiles = tiles.filter((tile) => {
    if (tile.requiresApproval) return canApprove
    return !tile.roles || has(tile.roles)
  })
  const pendingCount = tileValues.pendingApprovals ?? 0

  const activityColumns: DataTableColumn<PortalRequest>[] = [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'title', header: 'Request', cell: (row) => row.title },
    { id: 'date', header: 'Date', cell: (row) => formatDateTime(row.createdAt) },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageWrapper title="Dashboard">
      {!canFetchSummary && bootstrapped ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {!apiBase
            ? BACKEND_NOT_CONFIGURED
            : 'Sign in again to load dashboard data from the server.'}
        </div>
      ) : null}

      {summary.isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Dashboard could not load</p>
          <p className="mt-1">{summaryError ?? 'Request failed. Is the backend running?'}</p>
          {apiBase ? (
            <p className="mt-2 text-xs text-red-700">
              Expected API: <code className="rounded bg-red-100 px-1">{apiBase}/api/dashboard/summary</code>
            </p>
          ) : null}
        </div>
      ) : null}

      {summary.isLoading || (canFetchSummary && !summary.data && !summary.isError) ? (
        <Skeleton className="h-48 w-full" />
      ) : summary.data ? (
        <div className="space-y-6">
          <div className="animate-page-in-subtle relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--portal-navy)] via-[var(--portal-navy)] to-emerald-700 p-5 text-white shadow-lg sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[var(--portal-orange)]/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-white/75 sm:text-sm">
                  <Sparkles className="h-4 w-4 text-[var(--portal-orange)]" />
                  Welcome back
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Hi {firstName}
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {primaryRoleLabel}
                  </span>
                </p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  Welcome to the {brand.product} — {new Date().getFullYear()} Summary
                </p>
                {capabilitySummary ? (
                  <p className="mt-2 max-w-2xl text-xs text-white/80 sm:text-sm">{capabilitySummary}</p>
                ) : null}
              </div>
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold text-white ring-4 ring-white/20 backdrop-blur sm:flex">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {quickLinks.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">Quick actions for your role</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-[var(--portal-navy)]/20 hover:bg-blue-50/50"
                  >
                    <p className="text-sm font-semibold text-[var(--portal-navy)] group-hover:text-[var(--portal-orange)]">
                      {link.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">{link.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {canApprove && pendingCount > 0 ? (
            <Link
              to="/approvals"
              className="group flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-orange)]/15 text-[var(--portal-orange)]">
                  <ClipboardCopy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    You have {pendingCount} document{pendingCount === 1 ? '' : 's'} awaiting your approval
                  </p>
                  <p className="text-xs text-slate-600">Review and approve or reject pending requests for your team.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--portal-orange)] transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : null}

          <div className="portal-stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {visibleTiles.map((tile) => {
              const Icon = tile.icon
              const value = tileValues[tile.id] ?? 0
              return (
                <Link
                  key={tile.id}
                  to={tile.href}
                  className={`group relative flex min-h-24 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${tile.tone} p-3 text-white shadow-md ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-white/30 sm:gap-4 sm:p-4`}
                >
                  <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl transition-opacity duration-200 group-hover:opacity-80" />
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile.chip} ring-1 ring-white/30 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:h-12 sm:w-12`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <p key={value} className="animate-count-pop text-2xl font-bold leading-tight tabular-nums drop-shadow-sm sm:text-3xl">{value}</p>
                    <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-white/85 sm:text-xs">
                      {tile.label}
                    </p>
                  </div>
                  <ArrowRight className="relative hidden h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-1 sm:block" />
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

          <div className="animate-page-in-subtle rounded-2xl border border-[var(--portal-navy)]/10 bg-white/80 px-5 py-4 text-center shadow-sm backdrop-blur" style={{ animationDelay: '180ms' }}>
            <p className="text-sm font-semibold text-[var(--portal-navy)]">Powered by {brand.companyShort}</p>
            <p className="mt-1 text-xs text-slate-500">Secure employee self-service connected to Business Central</p>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
