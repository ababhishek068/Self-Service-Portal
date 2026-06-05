import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { useUnderConstruction } from '@/components/shared/UnderConstructionDialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { payrollMonths, payrollYears } from '@/data/payroll'

export function Payslip() {
  const [year, setYear] = useState('2025')
  const [month, setMonth] = useState('March')
  const { trigger, dialog } = useUnderConstruction()

  return (
    <PageWrapper title="Payslip" showPageHeading={false}>
      <PortalFormCard title="Payslip">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="year">Payroll Period Year:</Label>
              <Select
                id="year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                options={[{ label: '--select--', value: '' }, ...payrollYears.map((y) => ({ label: y, value: y }))]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="month">Period Month:</Label>
              <Select
                id="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                options={payrollMonths.map((m) => ({ label: m, value: m }))}
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button type="button" className="min-w-[120px] rounded-full" onClick={trigger}>
              Generate
            </Button>
          </div>
        </div>
      </PortalFormCard>
      {dialog}
    </PageWrapper>
  )
}
