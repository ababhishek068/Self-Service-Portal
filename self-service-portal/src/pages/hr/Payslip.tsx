import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { downloadPayslipPdf, listPayrollPeriods } from '@/api/endpoints/payroll'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function Payslip() {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const periodsQuery = useQuery({ queryKey: ['payroll', 'periods'], queryFn: listPayrollPeriods })
  const periods = periodsQuery.data ?? []
  const years = useMemo(
    () => [...new Set(periods.map((period) => String(period.year)))],
    [periods],
  )
  const months = useMemo(
    () =>
      periods
        .filter((period) => !year || String(period.year) === year)
        .map((period) => {
          const numeric = Number(period.month)
          return {
            value: period.month,
            label: Number.isInteger(numeric) && numeric >= 1 && numeric <= 12
              ? monthNames[numeric - 1]!
              : period.month,
          }
        })
        .filter((period, index, rows) => rows.findIndex((row) => row.value === period.value) === index),
    [periods, year],
  )

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      await downloadPayslipPdf(year, month)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Payslip generation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper title="Payslip" showPageHeading={false}>
      <PortalFormCard title="Payslip">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="year">Payroll Period Year</Label>
              <Select
                id="year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="Select year"
                options={years.map((value) => ({ label: value, value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="month">Period Month</Label>
              <Select
                id="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="Select month"
                options={months}
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              className="min-w-[120px] rounded-full"
              onClick={() => void generate()}
              disabled={loading || !year || !month}
            >
              <Download className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
        </div>
      </PortalFormCard>
    </PageWrapper>
  )
}
