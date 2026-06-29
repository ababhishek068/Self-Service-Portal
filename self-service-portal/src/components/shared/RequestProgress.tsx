import { Check, FileCheck2, ListPlus, Send } from 'lucide-react'

interface RequestProgressProps {
  status: string
  hasLines?: boolean
  requiresLines?: boolean
}

export function RequestProgress({ status, hasLines = false, requiresLines = false }: RequestProgressProps) {
  const approvalStarted = status !== 'Draft'
  const detailReady = !requiresLines || hasLines
  const steps = [
    { label: 'Draft created', note: 'Header saved in Business Central', done: true, active: false, icon: FileCheck2 },
    { label: requiresLines ? 'Lines & attachments' : 'Review details', note: detailReady ? 'Ready for approval' : 'Add at least one line', done: approvalStarted, active: !approvalStarted, icon: ListPlus },
    { label: 'Approval workflow', note: approvalStarted ? status : 'Not requested yet', done: ['Approved', 'Rejected', 'Cancelled', 'Posted'].includes(status), active: approvalStarted, icon: Send },
  ]

  return (
    <div className="grid gap-2 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white p-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon
        const complete = step.done || (index === 1 && detailReady && approvalStarted)
        return (
          <div key={step.label} className={`relative flex items-center gap-3 rounded-xl border p-3 transition ${step.active ? 'border-blue-300 bg-white shadow-sm' : 'border-transparent'}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-emerald-100 text-emerald-700' : step.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
              {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900"><span className="mr-1 text-xs text-slate-400">0{index + 1}</span>{step.label}</p>
              <p className="truncate text-xs text-slate-500">{step.note}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
