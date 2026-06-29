import { StatusBadge } from './StatusBadge'
import type { ApprovalStep } from '@/types/erp.types'

export function ApprovalHistory({ steps }: { steps: ApprovalStep[] }) {
  if (!steps.length) {
    return <p className="text-sm italic text-slate-500">No approval entries yet.</p>
  }

  const orderedSteps = [...steps].sort((left, right) => {
    const leftSequence = left.sequenceNo ?? Number.MAX_SAFE_INTEGER
    const rightSequence = right.sequenceNo ?? Number.MAX_SAFE_INTEGER
    return leftSequence - rightSequence
  })

  return (
    <div className="space-y-2">
      {orderedSteps.map((step, index) => (
        <div key={step.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
              Sequence {step.sequenceNo ?? index + 1}
            </span>
            <span>{step.actorName || step.actorEmployeeNo} - {step.role}</span>
          </div>
          <StatusBadge status={step.status} />
        </div>
      ))}
    </div>
  )
}
