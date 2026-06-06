import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { ApprovalTimeline } from '@/components/shared/ApprovalTimeline'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useApprovalDecision, useApprovalDetail } from '@/hooks/useApprovals'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { isMakerAllowedToApprove } from '@/utils/validators'

export function ApprovalDetail() {
  const { id } = useParams()
  const { employee } = useAuth()
  const { canApprove: hasApproverRole } = usePermissions()
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | null>(null)
  const detail = useApprovalDetail(id ?? '')
  const approval = useApprovalDecision(id ?? '')

  if (!id) return <Navigate to="/approvals" replace />
  const request = detail.data
  const isNotMaker = request && employee ? isMakerAllowedToApprove(request.makerEmployeeNo, employee.employeeNo) : false
  const canApprove = hasApproverRole && isNotMaker

  return (
    <PageWrapper
      title="Approval Detail"
      description="Review source document, maker/checker audit trail, and approve or reject according to ERP workflow."
      actions={
        <Button asChild variant="outline">
          <Link to="/approvals">Back to queue</Link>
        </Button>
      }
    >
      {detail.isLoading || !request ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <CardDescription>{request.requestNo}</CardDescription>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Maker</p>
                  <p className="font-medium text-slate-900">{request.makerName}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Amount / quantity</p>
                  <p className="font-medium text-slate-900">{formatCurrency(request.amount)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Submitted</p>
                  <p className="font-medium text-slate-900">{formatDateTime(request.submittedAt)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Approval comment</p>
                <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add approval note" />
              </div>

              {!canApprove ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {!hasApproverRole
                    ? 'Your role does not have approval authority for this document.'
                    : 'Maker cannot approve own request.'}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button disabled={!canApprove || approval.isPending} onClick={() => setDecision('Approved')}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" disabled={!canApprove || approval.isPending} onClick={() => setDecision('Rejected')}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maker/checker timeline</CardTitle>
              <CardDescription>Audit trail with timestamps.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline steps={request.approvalSteps} />
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(decision)}
        title={`${decision ?? 'Submit'} request`}
        description="This action writes an approval decision against the source document and cannot be performed by the maker."
        confirmLabel={decision ?? 'Submit'}
        onCancel={() => setDecision(null)}
        onConfirm={() => {
          if (decision) approval.mutate({ decision, comment })
          setDecision(null)
        }}
      />
    </PageWrapper>
  )
}
