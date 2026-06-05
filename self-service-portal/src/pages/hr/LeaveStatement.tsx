import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { leaveTypes } from '@/data/leaveTypes'

export function LeaveStatement() {
  const [leaveType, setLeaveType] = useState('')

  return (
    <PageWrapper title="Leave Statement" showPageHeading={false}>
      <PortalFormCard title="Leave Statement">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="leaveType">Leave Type:</Label>
            <Select
              id="leaveType"
              value={leaveType}
              onChange={(event) => setLeaveType(event.target.value)}
              options={leaveTypes.map((value) => ({
                label: value,
                value: value === '--select--' ? '' : value,
              }))}
            />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="button" className="min-w-[120px] rounded-full">
              View Statement
            </Button>
          </div>
        </div>
      </PortalFormCard>
    </PageWrapper>
  )
}
