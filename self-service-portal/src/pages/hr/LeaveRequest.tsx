import { useState } from 'react'
import { formatISO } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { leaveTypes } from '@/utils/constants'
import { Badge } from '@/components/ui/badge'

const relievers = [
  { label: 'select', value: '' },
  { label: '018 - SEADA IBRAHIM mohammed', value: '018' },
  { label: '024 - Ahmed Hassan', value: '024' },
  { label: '031 - Fatima Ali', value: '031' },
]

export function LeaveRequest() {
  const today = formatISO(new Date(), { representation: 'date' })
  const [leaveType, setLeaveType] = useState('Postnatal Leave/Maternity')
  const [appliedDays, setAppliedDays] = useState('')
  const [halfDay, setHalfDay] = useState('Normal')
  const [startDate, setStartDate] = useState(today)
  const [reliever, setReliever] = useState('')
  const [reason, setReason] = useState('')

  const entitlement = leaveType.includes('Postnatal') ? '120 days' : '21 days'
  const availableDays = leaveType.includes('Postnatal') ? 360 : 16

  return (
    <PageWrapper title="Leave Requisition" showPageHeading={false}>
      <form
        className="rounded border border-[var(--portal-card-border)] bg-white p-5 shadow-sm"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="leaveType">Leave Type:</Label>
            <Select
              id="leaveType"
              value={leaveType}
              onChange={(event) => setLeaveType(event.target.value)}
              options={leaveTypes
                .filter((t) => t !== '--select--')
                .map((value) => ({ label: value, value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Leave Entitlement:</Label>
            <Input readOnly value={entitlement} className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Available Days:</Label>
            <div>
              <Badge variant="green" className="px-4 py-1.5 text-base">
                {availableDays}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="appliedDays">Applied Days:</Label>
            <Input id="appliedDays" type="number" value={appliedDays} onChange={(e) => setAppliedDays(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="halfDay">Select Whether Half Day:</Label>
            <Select
              id="halfDay"
              value={halfDay}
              onChange={(e) => setHalfDay(e.target.value)}
              options={[
                { label: 'Normal', value: 'Normal' },
                { label: 'Half Day AM', value: 'AM' },
                { label: 'Half Day PM', value: 'PM' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start Date:</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>End Date:</Label>
            <Input readOnly value="######" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Return Date:</Label>
            <Input readOnly value="######" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reliever">Reliever:</Label>
            <Select id="reliever" value={reliever} onChange={(e) => setReliever(e.target.value)} options={relievers} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Leave Reason:</Label>
            <Textarea id="reason" rows={5} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Leave Attachments</p>
            <p className="mt-2">After Submission, Click on the Applied Leave and Add Relevant Attachments!</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button type="submit" className="min-w-[120px] rounded-full px-8">
            Submit
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
