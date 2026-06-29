import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, Eye, FileCheck2, Search, UserRound } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApprovals } from '@/hooks/useApprovals'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { ApprovalQueueItem } from '@/types/erp.types'
import type { ApprovalListType } from '@/types/approval'
import { useMemo, useState } from 'react'
import { moduleLabels } from '@/data/moduleLabels'
import type { PortalModuleKey } from '@/types/erp.types'

interface ApprovalsListProps {
  type: ApprovalListType
  title: string
  emptyTitle?: string
}

export function ApprovalsList({ type, title, emptyTitle }: ApprovalsListProps) {
  const approvals = useApprovals(type)
  const [moduleFilter, setModuleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const actionLabel = type === 'pending' ? 'Open' : 'View'

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'leave', label: 'Leave' },
    { value: 'imprest', label: 'Imprest' },
    { value: 'imprestSurrender', label: 'Surrender' },
    { value: 'purchaseRequisition', label: 'Purchase' },
    { value: 'storeRequisition', label: 'Store' },
    { value: 'pettyCashReplenishment', label: 'PV' },
    { value: 'pettyCash', label: 'PC' },
    { value: 'transferOrder', label: 'Order' },
  ]
  const sourceRows = useMemo(() => approvals.data ?? [], [approvals.data])
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sourceRows.filter((row) => {
      if (moduleFilter !== 'all' && row.module !== moduleFilter) return false
      if (!query) return true
      return [row.requestNo, row.makerName, row.makerEmployeeNo, row.module, row.title]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    })
  }, [moduleFilter, search, sourceRows])

  const columns: DataTableColumn<ApprovalQueueItem>[] = type === 'pending' ? [
    { id: 'requestNo', header: 'Document No.', cell: (row) => row.requestNo },
    { id: 'maker', header: 'Sender', cell: (row) => row.makerName || row.makerEmployeeNo },
    { id: 'submitted', header: 'Date sent', cell: (row) => formatDateTime(row.submittedAt) },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => (
        <Button asChild variant="action" size="sm" className="rounded-full">
          <Link to={`/approvals/${row.id}?queue=${type}`}>
            <Eye className="h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      ),
    },
  ] : [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'module', header: 'Module', cell: (row) => row.module },
    { id: 'maker', header: 'Maker', cell: (row) => row.makerName },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.submittedAt) },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => (
        <Button asChild variant="action" size="sm" className="rounded-full">
          <Link to={`/approvals/${row.id}?queue=${type}`}>
            <Eye className="h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <PageWrapper title={title}>
      {type === 'pending' && !approvals.isLoading ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-white/90 shadow-[0_20px_60px_-35px_rgba(0,58,112,0.5)] backdrop-blur">
          <div className="grid gap-4 bg-gradient-to-r from-[var(--portal-navy)] via-[#075b9a] to-[#0a7db5] p-5 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                <FileCheck2 className="h-4 w-4" /> Approval workspace
              </div>
              <h2 className="text-xl font-semibold">{sourceRows.length} documents awaiting your decision</h2>
              <p className="mt-1 text-sm text-blue-100">Filter by workflow, review the source record, then approve or reject with an audit comment.</p>
            </div>
            <label className="relative block min-w-0 md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search document or sender"
                className="h-11 w-full rounded-xl border border-white/50 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none ring-orange-400 transition focus:ring-2"
              />
            </label>
          </div>
          <div className="flex min-w-max gap-1.5 overflow-x-auto p-3" role="tablist" aria-label="Approval document type">
            {filters.map((filter) => {
              const count = filter.value === 'all'
                ? sourceRows.length
                : sourceRows.filter((row) => row.module === filter.value).length
              const active = moduleFilter === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setModuleFilter(filter.value)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-[var(--portal-navy)] text-white shadow-md' : 'text-slate-600 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-[var(--portal-navy)]'}`}
                >
                  {filter.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-[var(--portal-orange)] text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      {approvals.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        type === 'pending' ? (
          rows.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => (
                <article key={row.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--portal-orange)] via-amber-400 to-[var(--portal-blue-action)]" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--portal-navy)] transition group-hover:scale-105 group-hover:bg-blue-100">
                        <FileCheck2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{moduleLabels[row.module as PortalModuleKey] ?? row.title ?? row.module}</p>
                        <h3 className="truncate text-lg font-bold text-slate-900">{row.requestNo}</h3>
                      </div>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-5 space-y-2.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-blue-700" /><span className="truncate">{row.makerName || row.makerEmployeeNo || 'Unknown sender'}</span></div>
                    <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-700" /><span>{formatDateTime(row.submittedAt)}</span></div>
                  </div>
                  <Button asChild className="mt-4 w-full rounded-xl" variant="action">
                    <Link to={`/approvals/${row.id}?queue=${type}`}>
                      Review document <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">{emptyTitle ?? 'No approvals match this filter.'}</div>
          )
        ) : (
          <DataTable rows={rows} columns={columns} getRowId={(row) => row.id} emptyTitle={emptyTitle} compact />
        )
      )}
    </PageWrapper>
  )
}
