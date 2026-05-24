import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/formatters'
import type { ApprovalStep } from '@/types/erp.types'

export function ApprovalTimeline({ steps }: { steps: ApprovalStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const isDone = ['Approved', 'Submitted'].includes(step.status)
        const isCurrent = step.status === 'Pending Approval'
        const Icon = isDone ? CheckCircle2 : isCurrent ? CircleDashed : Circle
        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon className={cn('h-5 w-5', isDone ? 'text-emerald-600' : isCurrent ? 'text-amber-600' : 'text-slate-300')} />
              {index < steps.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{step.actorName}</p>
                <StatusBadge status={step.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {step.role} · {formatDateTime(step.timestamp)}
              </p>
              {step.note ? <p className="mt-2 rounded-md bg-slate-50 p-2 text-sm text-slate-700">{step.note}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
