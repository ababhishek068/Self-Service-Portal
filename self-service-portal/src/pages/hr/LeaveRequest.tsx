import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { FileUpload } from '@/components/shared/FileUpload'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { useToast } from '@/components/feedback/ToastProvider'
import { useConfirm } from '@/components/feedback/ConfirmProvider'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RequestProgress } from '@/components/shared/RequestProgress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchLeaveTypes,
  fetchRelievers,
  cancelLeaveRequest,
  getLeaveBalance,
  getLeaveDates,
  listLeaveRequests,
  requestLeaveApproval,
  submitLeaveRequest,
  type LeaveListRow,
  type LeaveType,
} from '@/api/endpoints/leave'
import {
  deleteRequestAttachment,
  downloadRequestAttachment,
  getModuleRequest,
  uploadRequestAttachment,
} from '@/api/endpoints/requestEndpoint'
import { useAuth } from '@/hooks/useAuth'
import type { Attachment } from '@/types/erp.types'

const DASH = '—'

const halfDayOptions = [
  { value: '0', label: 'Normal' },
  { value: '1', label: 'Half Day (Morning)' },
  { value: '2', label: 'Half Day (Evening)' },
] as const

type HalfDayValue = (typeof halfDayOptions)[number]['value']

function formatPretty(iso: string): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'd MMM yyyy')
  } catch {
    return iso
  }
}

function filterLeaveTypesByGender(types: LeaveType[], gender: string): LeaveType[] {
  const g = gender.toLowerCase()
  return types.filter((type) => {
    if (['MATERNITY', 'PRENATAL'].includes(type.code)) return g === 'female'
    if (type.code === 'PATERNITY') return g === 'male'
    return true
  })
}

function payloadValue(payload: Record<string, unknown>, keys: string[], fallback = DASH) {
  for (const key of keys) {
    const value = payload[key]
    if (value !== undefined && value !== null && String(value) !== '') return String(value)
  }
  return fallback
}

export function LeaveRequest() {
  const { employee } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const leaveListQuery = useQuery({ queryKey: ['hr', 'leave-list'], queryFn: listLeaveRequests })
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [creationAttachments, setCreationAttachments] = useState<Attachment[]>([])
  const [detailAction, setDetailAction] = useState<string | null>(null)
  const detailQuery = useQuery({
    queryKey: ['hr', 'leave-detail', selectedRequestId],
    queryFn: () =>
      getModuleRequest(
        { module: 'leave', entity: 'leave' },
        selectedRequestId!,
      ),
    enabled: Boolean(selectedRequestId),
  })
  const [leaveType, setLeaveType] = useState('')
  const [entitlement, setEntitlement] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isHourly, setIsHourly] = useState(false)
  const [pendingDuplicate, setPendingDuplicate] = useState(false)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [types, setTypes] = useState<LeaveType[]>([])
  const [relievers, setRelievers] = useState<Array<{ value: string; label: string }>>([])
  const [submittingForm, setSubmittingForm] = useState(false)

  const gender = employee?.gender || 'Male'
  const availableTypes = filterLeaveTypesByGender(types, gender)

  useEffect(() => {
    fetchLeaveTypes()
      .then((fetched) => setTypes(filterLeaveTypesByGender(fetched, gender)))
      .catch(() => setTypes([]))
    fetchRelievers()
      .then(setRelievers)
      .catch(() => setRelievers([]))
  }, [gender])

  const [appliedDays, setAppliedDays] = useState('')
  const [appliedHours, setAppliedHours] = useState('')
  const [halfDay, setHalfDay] = useState<HalfDayValue>('0')
  const [startDate, setStartDate] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [datesLoading, setDatesLoading] = useState(false)
  const [reliever, setReliever] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const showSecondary = leaveType !== '' && balance !== null && !pendingDuplicate && !balanceLoading
  const canSubmit = showSecondary && balance > 0

  useEffect(() => {
    setEndDate('')
    setReturnDate('')
    setAppliedDays('')
    setAppliedHours('')
    setStartDate('')
    setStartDateTime('')
    setError(null)
    setSuccess(null)
    if (!leaveType) {
      setEntitlement(null)
      setBalance(null)
      return
    }
    const type = types.find((t) => t.code === leaveType)
    setEntitlement(type?.days ?? null)
    setBalanceLoading(true)
    getLeaveBalance(leaveType)
      .then((res) => {
        setBalance(res.balance)
        setIsHourly(res.isHourly)
        setPendingDuplicate(res.pendingCount > 0)
        if (res.pendingCount > 0) {
          setError(
            'You cannot apply a new leave while there is another one of the same type that is pending approval.',
          )
        }
      })
      .finally(() => setBalanceLoading(false))
  }, [leaveType, types])

  useEffect(() => {
    setEndDate('')
    setReturnDate('')

    const duration = isHourly ? Number(appliedHours) : Number(appliedDays)
    const starting = isHourly ? startDateTime : startDate
    if (!duration || !starting || !leaveType) return

    if (entitlement !== null && duration > entitlement) {
      setError(`The maximum number of days you can apply for is ${entitlement}`)
      return
    }
    if (isHourly && duration > 4) {
      setError('Oops! you cannot apply more than 4 hours on half-day leave.')
      return
    }

    const dateOnly = isHourly ? starting.slice(0, 10) : starting
    setError(null)
    setDatesLoading(true)
    getLeaveDates(leaveType, duration, dateOnly, halfDay)
      .then((res) => {
        if (res.isWeekend) {
          setError('Leave start date cannot be on a weekend')
          if (isHourly) setStartDateTime('')
          else setStartDate('')
          return
        }
        setEndDate(res.endDate)
        setReturnDate(res.returnDate)
      })
      .finally(() => setDatesLoading(false))
  }, [appliedDays, appliedHours, startDate, startDateTime, halfDay, leaveType, isHourly, entitlement])

  useEffect(() => {
    if (halfDay === '1' || halfDay === '2') {
      setAppliedDays('0.5')
    }
  }, [halfDay])

  const resetForm = () => {
    setLeaveType('')
    setAppliedDays('')
    setAppliedHours('')
    setHalfDay('0')
    setStartDate('')
    setStartDateTime('')
    setEndDate('')
    setReturnDate('')
    setReliever('')
    setReason('')
    setCreationAttachments([])
    setError(null)
    setSuccess(null)
  }

  const leaveColumns: DataTableColumn<LeaveListRow>[] = [
    { id: 'code', header: 'Application No.', cell: (row) => row.ApplicationCode },
    { id: 'type', header: 'Leave Type', cell: (row) => row.LeaveType },
    { id: 'days', header: 'Days', cell: (row) => row.DaysApplied ?? '—' },
    { id: 'start', header: 'Start', cell: (row) => row.StartDate ?? '—' },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.Status} /> },
  ]

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const submittedStartDate = isHourly ? startDateTime.slice(0, 10) : startDate
    const submittedDays = isHourly ? Number(appliedHours || 0) : Number(appliedDays || 0)
    if (!leaveType || !reason.trim() || !endDate || !submittedStartDate || !submittedDays) {
      setError('Please complete all required fields.')
      return
    }
    if (leaveType === 'SICK' && creationAttachments.length === 0) {
      setError('A supporting attachment is required for sick leave.')
      return
    }
    if (creationAttachments.some((file) => file.size > 2_999_000)) {
      setError('Leave attachments cannot exceed 3 MB each.')
      return
    }
    if (balance !== null && submittedDays > balance) {
      setError(`Insufficient leave balance. Available: ${balance} day(s).`)
      return
    }
    const confirmed = await confirm({
      title: 'Create leave draft',
      message: 'Create this leave application as a draft? You can review attachments before requesting approval.',
      confirmLabel: 'Create draft',
    })
    if (!confirmed) return
    setSubmittingForm(true)
    try {
      const result = await submitLeaveRequest({
        leaveType,
        appliedDays: submittedDays,
        startDate: submittedStartDate,
        isHalfDayLeave: halfDay,
        reliever,
        reason,
      })
      if (result.ok) {
        const createdRequestId =
          result.request?.id ??
          (result.returnValue ? `leave-${result.returnValue}` : '')
        let attachmentError = ''
        if (creationAttachments.length > 0) {
          try {
            if (!createdRequestId) {
              throw new Error('The document number was not returned.')
            }
            for (const file of creationAttachments) {
              await uploadRequestAttachment(createdRequestId, {
                fileName: file.fileName,
                fileType: file.fileType,
                size: file.size,
                contentBase64: file.contentBase64,
                description: file.description || 'Leave Attachment',
              })
            }
          } catch (err: unknown) {
            attachmentError = err instanceof Error ? err.message : 'Attachment upload failed.'
          }
        }
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        await queryClient.invalidateQueries({ queryKey: ['hr', 'leave-list'] })
        resetForm()
        if (createdRequestId) setSelectedRequestId(createdRequestId)
        setSuccess(attachmentError
          ? 'Leave draft was created, but its attachment could not be uploaded. Review the draft and retry the upload.'
          : 'Leave draft created. Review it below, then click Request Approval.')
        setError(null)
        toast.success('Leave draft created. Review it before requesting approval.')
        if (attachmentError) toast.error(attachmentError, 'Attachment not uploaded')
      } else {
        setError(result.message ?? 'Submission failed.')
        toast.error(result.message ?? 'Submission failed.', 'Leave not submitted')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      toast.error(err instanceof Error ? err.message : 'Submission failed.', 'Leave not submitted')
    } finally {
      setSubmittingForm(false)
    }
  }

  const refreshLeave = async () => {
    await queryClient.invalidateQueries({ queryKey: ['hr', 'leave-list'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    if (selectedRequestId) await detailQuery.refetch()
  }

  const uploadAttachments = async () => {
    const selected = detailQuery.data
    if (!selected || pendingAttachments.length === 0) return
    setDetailAction('upload')
    try {
      for (const file of pendingAttachments) {
        await uploadRequestAttachment(selected.id, {
          fileName: file.fileName,
          fileType: file.fileType,
          size: file.size,
          contentBase64: file.contentBase64,
          description: file.description || file.fileName,
        })
      }
      setPendingAttachments([])
      await refreshLeave()
      toast.success('Leave attachment uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Attachment upload failed', 'Upload failed')
    } finally {
      setDetailAction(null)
    }
  }

  const removeAttachment = async (attachmentId: string) => {
    const selected = detailQuery.data
    if (!selected) return
    const confirmed = await confirm({
      title: 'Delete attachment',
      message: 'Delete this attachment from the leave application?',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!confirmed) return
    setDetailAction(attachmentId)
    try {
      await deleteRequestAttachment(selected.id, attachmentId)
      await refreshLeave()
      toast.success('Attachment deleted')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Attachment deletion failed', 'Delete failed')
    } finally {
      setDetailAction(null)
    }
  }

  const cancelSelectedLeave = async () => {
    const selected = detailQuery.data
    if (!selected) return
    const confirmed = await confirm({
      title: 'Cancel leave application',
      message: `Cancel leave application ${selected.requestNo}?`,
      confirmLabel: 'Cancel application',
      tone: 'danger',
    })
    if (!confirmed) return
    setDetailAction('cancel')
    try {
      const result = await cancelLeaveRequest(selected.requestNo)
      if (!result.ok) throw new Error(result.message || 'Leave cancellation failed')
      await refreshLeave()
      toast.success(result.message || 'Leave application cancelled')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Leave cancellation failed', 'Cancel failed')
    } finally {
      setDetailAction(null)
    }
  }

  const requestSelectedLeaveApproval = async () => {
    const selected = detailQuery.data
    if (!selected) return
    const confirmed = await confirm({
      title: 'Request leave approval',
      message: `Send leave application ${selected.requestNo} for approval?`,
      confirmLabel: 'Request approval',
    })
    if (!confirmed) return
    setDetailAction('approval')
    try {
      const result = await requestLeaveApproval(selected.requestNo)
      if (!result.ok) throw new Error(result.message || 'Approval request failed')
      await refreshLeave()
      toast.success(result.message || 'Leave application sent for approval')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approval request failed', 'Approval not requested')
    } finally {
      setDetailAction(null)
    }
  }

  const selected = detailQuery.data
  const selectedPayload = selected?.payload ?? {}
  const selectedIsMutable = selected
    ? ['Open', 'Draft', 'Pending Approval'].includes(selected.status)
    : false
  const selectedCanRequestApproval = selected
    ? ['Open', 'Draft'].includes(selected.status)
    : false

  return (
    <PageWrapper
      title="Leave Requisition"
      showPageHeading={false}
      actions={<PortalNewButton label="New Request" onClick={resetForm} />}
    >
      <form onSubmit={handleSubmit} className="portal-form-card animate-page-in mx-auto w-full max-w-5xl">
        <div className="portal-form-card-header relative px-4 py-3 text-center text-sm font-semibold tracking-wide text-white sm:text-base">
          New Leave Request
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {error ? (
            <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          {success ? (
            <div className="rounded border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                placeholder="--select--"
                options={availableTypes.map((t) => ({
                  value: t.code,
                  label: `${t.description} (Entitlement: ${t.days})`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Leave Entitlement</Label>
              <p className="flex h-10 items-center text-sm font-semibold text-slate-700">
                {entitlement !== null ? `${entitlement} days` : DASH}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Available Days</Label>
              <div className="flex h-10 items-center">
                {balanceLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : balance !== null ? (
                  <Badge variant="green" className="px-4 py-1 text-sm">
                    {balance}
                  </Badge>
                ) : (
                  <span className="text-sm text-slate-400">{DASH}</span>
                )}
              </div>
            </div>
          </div>

          {showSecondary ? (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              {balance <= 0 ? (
                <div className="rounded border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  You have no available leave balance for this type. Contact HR if you believe this is incorrect.
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {!isHourly ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="appliedDays">Applied Days</Label>
                    <Input
                      id="appliedDays"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={appliedDays}
                      onChange={(e) => setAppliedDays(e.target.value)}
                      disabled={halfDay !== '0'}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="appliedHours">Applied Hours</Label>
                    <Input
                      id="appliedHours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="4"
                      value={appliedHours}
                      onChange={(e) => setAppliedHours(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="halfDay">Select Whether Half Day</Label>
                  <Select
                    id="halfDay"
                    value={halfDay}
                    onChange={(e) => setHalfDay(e.target.value as HalfDayValue)}
                    options={halfDayOptions.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </div>

                {!isHourly ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="startDateTime">Start Date Time</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label>Applied Days</Label>
                  <p className="flex h-10 items-center text-sm font-semibold text-slate-700">
                    {appliedDays || appliedHours || DASH}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <p className="flex h-10 items-center text-sm font-semibold text-slate-700">
                    {datesLoading ? <Skeleton className="h-5 w-32" /> : endDate ? formatPretty(endDate) : DASH}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Return Date</Label>
                  <p className="flex h-10 items-center text-sm font-semibold text-slate-700">
                    {datesLoading ? <Skeleton className="h-5 w-32" /> : returnDate ? formatPretty(returnDate) : DASH}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reliever">Reliever</Label>
                  <Select
                    id="reliever"
                    value={reliever}
                    onChange={(e) => setReliever(e.target.value)}
                    placeholder="select"
                    options={relievers}
                  />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_280px] lg:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Leave Reason</Label>
                  <Textarea
                    id="reason"
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 rounded border-l-4 border-orange-500 bg-orange-50 p-3 text-sm text-orange-800">
                  <p className="font-bold">
                    Leave Attachments{leaveType === 'SICK' ? ' (Required)' : ' (Optional)'}
                  </p>
                  <FileUpload files={creationAttachments} onChange={setCreationAttachments} />
                  <p>Maximum 3 MB per file for leave creation.</p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  className="min-w-[140px] rounded-full"
                  disabled={submittingForm || !canSubmit}
                >
                  {submittingForm ? 'Creating draft…' : 'Create draft'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </form>

      <div className="mt-6">
        <h2 className="portal-page-title mb-3 text-base font-semibold">My Leave Applications</h2>
        <DataTable
          rows={leaveListQuery.data ?? []}
          columns={leaveColumns}
          getRowId={(row) => row.ApplicationCode}
          selectedRowId={selected?.requestNo}
          onRowClick={(row) => {
            setSelectedRequestId(`leave-${row.ApplicationCode}`)
            setPendingAttachments([])
          }}
          compact
          emptyTitle="No leave applications yet."
        />
      </div>

      {selectedRequestId ? (
        <div className="portal-form-card mt-6 overflow-hidden">
          <div className="portal-form-card-header flex items-center justify-between gap-3 px-4 py-3 text-white">
            <h2 className="font-semibold">Leave Application Details</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRequestId(null)
                setPendingAttachments([])
              }}
            >
              Close
            </Button>
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            {detailQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : detailQuery.isError || !selected ? (
              <p className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                Could not load this leave application.
              </p>
            ) : (
              <>
                <RequestProgress status={selected.status} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Application No.</p>
                    <p className="font-semibold text-slate-900">{selected.requestNo}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Leave Type</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['LeaveType', 'Leave_Type', 'leaveTypeDescription', 'leaveType'])}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Days Applied</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['DaysApplied', 'Days_Applied', 'appliedDays'])}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Start Date</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['StartDate', 'Start_Date', 'startDate'])}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">End Date</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['EndDate', 'End_Date', 'endDate'])}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Return Date</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['ReturnDate', 'Return_Date', 'returnDate'])}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Reason</dt>
                    <dd className="text-sm font-medium">
                      {payloadValue(selectedPayload, ['Reason', 'reason'])}
                    </dd>
                  </div>
                </dl>

                <section className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">Attachments</h3>
                  {selectedIsMutable ? (
                    <div className="mb-4 space-y-3 rounded-md border border-slate-200 p-3">
                      <FileUpload files={pendingAttachments} onChange={setPendingAttachments} />
                      <Button
                        type="button"
                        size="sm"
                        disabled={detailAction === 'upload' || pendingAttachments.length === 0}
                        onClick={() => void uploadAttachments()}
                      >
                        {detailAction === 'upload' ? 'Uploading…' : 'Upload'}
                      </Button>
                    </div>
                  ) : null}
                  {selected.attachments.length ? (
                    <div className="divide-y divide-slate-100 border-y border-slate-200">
                      {selected.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {attachment.description || attachment.fileName}
                            </p>
                            <p className="text-xs text-slate-500">{attachment.fileName}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={detailAction === attachment.id}
                              onClick={() => void downloadRequestAttachment(selected.id, attachment)}
                            >
                              Download
                            </Button>
                            {selectedIsMutable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                disabled={detailAction === attachment.id}
                                onClick={() => void removeAttachment(attachment.id)}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-500">No attachments.</p>
                  )}
                </section>

                {selectedIsMutable ? (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                    {selectedCanRequestApproval ? (
                      <Button
                        type="button"
                        disabled={detailAction === 'approval'}
                        onClick={() => void requestSelectedLeaveApproval()}
                      >
                        {detailAction === 'approval' ? 'Requesting…' : 'Request Approval'}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={detailAction === 'cancel'}
                      onClick={() => void cancelSelectedLeave()}
                    >
                      {detailAction === 'cancel' ? 'Cancelling…' : 'Cancel Application'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
