import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { downloadMasterRollPdf, listPayrollPeriods } from '@/api/endpoints/payroll'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function MasterRoll() {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [postingGroup, setPostingGroup] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const periodsQuery = useQuery({ queryKey: ['payroll', 'periods'], queryFn: listPayrollPeriods })
  const postingGroups = useLookupOptions('payroll-posting-groups')
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
    if (!year || !month) return
    setSubmitting(true)
    setError('')
    try {
      await downloadMasterRollPdf(year, month, postingGroup)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to generate master roll.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper title="Payroll Master Roll" description="Generate the Business Central payroll master roll PDF.">
      <PortalFormCard title="Generate Master Roll">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ceoYear">Payroll Period Year</Label>
              <Select
                id="ceoYear"
                value={year}
                onChange={(event) => {
                  setYear(event.target.value)
                  setMonth('')
                }}
                placeholder="Select year"
                options={years.map((value) => ({ value, label: value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ceoMonth">Period Month</Label>
              <Select
                id="ceoMonth"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="Select month"
                options={months}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postingGroup">Posting Group (Optional)</Label>
              <Select
                id="postingGroup"
                value={postingGroup}
                onChange={(event) => setPostingGroup(event.target.value)}
                placeholder="All posting groups"
                options={postingGroups.options}
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="accent"
              className="rounded-full"
              disabled={submitting || !year || !month}
              onClick={() => void generate()}
            >
              <Download className="h-4 w-4" />
              {submitting ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
        </div>
      </PortalFormCard>
    </PageWrapper>
  )
}
