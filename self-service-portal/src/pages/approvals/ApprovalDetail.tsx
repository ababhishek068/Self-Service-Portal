import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, Download, RefreshCw, X } from 'lucide-react'
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
import { extractApplicationReason } from '@/utils/applicationReason'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { isMakerAllowedToApprove } from '@/utils/validators'
import { downloadRequestAttachment } from '@/api/endpoints/requestEndpoint'

const hiddenLineFields = new Set([
  'id',
  'recid',
  'systemid',
  'systemcreatedat',
  'systemcreatedby',
  'systemmodifiedat',
  'systemmodifiedby',
  'odataetag',
])

function visibleLineKeys(lines: Record<string, unknown>[]) {
  const first = lines[0] ?? {}
  return Object.keys(first).filter((key) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (hiddenLineFields.has(normalized) || normalized.startsWith('system')) return false
    return lines.some((line) => line[key] !== undefined && line[key] !== null && String(line[key]).trim() !== '')
  })
}

function lineFieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function ApprovalDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { employee } = useAuth()
  const { canApprove: hasApproverRole } = usePermissions()
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | null>(null)
  const detail = useApprovalDetail(id ?? '')
  const approval = useApprovalDecision(id ?? '')
  const request = detail.data
  const applicationReason = request ? extractApplicationReason(request.payload, request.title) : ''
  const queueType = searchParams.get('queue')
  const displayStatus = queueType === 'approved'
    ? 'Approved'
    : queueType === 'rejected'
      ? 'Rejected'
      : request?.status
  const isReadOnly =
    displayStatus === 'Approved' ||
    displayStatus === 'Rejected' ||
    displayStatus === 'Cancelled'
  const isNotMaker = request && employee ? isMakerAllowedToApprove(request.makerEmployeeNo, employee.employeeNo) : false
  const canApprove = hasApproverRole && isNotMaker && !isReadOnly
  const payload = request?.payload ?? {}
  const lines = Array.isArray(payload.lines)
    ? (payload.lines as Record<string, unknown>[])
    : []
  const lineKeys = visibleLineKeys(lines)

  useEffect(() => {
    if (request && applicationReason) {
      setComment(applicationReason)
    }
  }, [request?.id, applicationReason])

  if (!id) return <Navigate to="/approvals" replace />

  if (detail.isError) {
    return (
      <PageWrapper title="Document unavailable" description="The approval entry exists, but its source document could not be loaded from Business Central.">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Could not load this document</p>
              <p className="mt-1 text-sm text-slate-600">{detail.error instanceof Error ? detail.error.message : 'Business Central did not return the source document.'}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => void detail.refetch()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button asChild variant="outline"><Link to="/approvals">Back to queue</Link></Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  const backLink =
    queueType === 'approved' || request?.status === 'Approved'
      ? '/approvals/approved'
      : queueType === 'rejected' || request?.status === 'Rejected'
        ? '/approvals/rejected'
        : '/approvals'

  return (
    <PageWrapper
      title={isReadOnly ? 'Document View' : 'Approval Detail'}
      description={
        isReadOnly
          ? 'Review the submitted document and its approval workflow.'
          : 'Review source document, maker/checker audit trail, and approve or reject according to ERP workflow.'
      }
      actions={
        <Button asChild variant="outline">
          <Link to={backLink}>Back to queue</Link>
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
                <StatusBadge status={displayStatus ?? request.status} />
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

              {applicationReason ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Application reason</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{applicationReason}</p>
                </div>
              ) : null}

              {queueType && displayStatus !== request.status ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  The approval entry is <strong>{displayStatus}</strong>; the current Business Central source document is <strong>{request.status}</strong>.
                </div>
              ) : null}

              {payload.sourceDocumentAvailable === false ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Source document is no longer published by Business Central</p>
                    <p className="mt-1 text-amber-800">The approval entry and its audit trail are still available. Open entries can still be approved or rejected using the Business Central approval entry number.</p>
                  </div>
                </div>
              ) : null}

              {lines.length && lineKeys.length ? (
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Document lines</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 text-xs text-slate-500">
                        <tr>
                          {lineKeys.map((key) => (
                            <th key={key} className="px-2 py-2">
                              {lineFieldLabel(key)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, index) => (
                          <tr key={String(line.id ?? line.lineNo ?? index)} className="border-b border-slate-100">
                            {lineKeys.map((key) => (
                              <td key={key} className="px-2 py-2">{String(line[key] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">Attachments</p>
                {request.attachments.length ? (
                  <div className="divide-y divide-slate-100 border-y border-slate-200">
                    {request.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-slate-500">{attachment.description || attachment.fileType}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void downloadRequestAttachment(request.id, attachment)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-slate-500">No attachments.</p>}
              </div>

              {isReadOnly ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  This document is {(displayStatus ?? request.status).toLowerCase()}. Use the workflow timeline on the right to review
                  maker/checker steps and any approval comments.
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-900">Approval comment</p>
                    <Textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Add approval note (pre-filled from application reason)"
                    />
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
                    <Button
                      variant="destructive"
                      disabled={!canApprove || approval.isPending}
                      onClick={() => setDecision('Rejected')}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
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
          if (decision) approval.mutate({ decision, comment: comment.trim() || applicationReason })
          setDecision(null)
        }}
      />
    </PageWrapper>
  )
}
