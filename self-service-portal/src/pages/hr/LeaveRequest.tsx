import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
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
  getLeaveBalance,
  getLeaveDates,
  leaveTypeCatalog,
  relieversMock,
  submitLeaveRequest,
  type LeaveType,
} from '@/api/endpoints/leave'

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

export function LeaveRequest() {
  const [leaveType, setLeaveType] = useState('')
  const [entitlement, setEntitlement] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isHourly, setIsHourly] = useState(false)
  const [pendingDuplicate, setPendingDuplicate] = useState(false)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [types, setTypes] = useState<LeaveType[]>(leaveTypeCatalog)
  const [relievers, setRelievers] = useState(relieversMock)
  const [submittingForm, setSubmittingForm] = useState(false)

  useEffect(() => {
    fetchLeaveTypes()
      .then(setTypes)
      .catch(() => setTypes(leaveTypeCatalog))
    fetchRelievers()
      .then(setRelievers)
      .catch(() => setRelievers(relieversMock))
  }, [])

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

  const showSecondary = leaveType !== '' && balance !== null && balance > 0 && !pendingDuplicate

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!leaveType || !reason || !endDate) {
      setError('Please complete all required fields.')
      return
    }
    if (!window.confirm('Are you sure you want to submit this leave application?')) return
    setSubmittingForm(true)
    try {
      const result = await submitLeaveRequest({
        leaveType,
        appliedDays: Number(appliedDays || 0),
        startDate,
        isHalfDayLeave: halfDay,
        reliever,
        reason,
      })
      if (result.ok) {
        setSuccess(result.message ?? 'Leave application submitted successfully.')
        setError(null)
      } else {
        setError(result.message ?? 'Submission failed.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmittingForm(false)
    }
  }

  return (
    <PageWrapper
      title="Leave Requisition"
      showPageHeading={false}
      actions={
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/hr/leave-request">
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </Button>
      }
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
                options={types.map((t) => ({
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
                <div className="rounded border-l-4 border-orange-500 bg-orange-50 p-3 text-sm text-orange-800">
                  <p className="font-bold">Leave Attachments</p>
                  <p className="mt-1">
                    After Submission, click on the applied leave and add relevant attachments.
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  className="min-w-[140px] rounded-full"
                  disabled={submittingForm}
                >
                  {submittingForm ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </PageWrapper>
  )
}
