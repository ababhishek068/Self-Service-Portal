import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPayslip } from '@/api/endpoints/payroll'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { payrollMonths, payrollYears } from '@/data/payroll'
import { formatCurrency } from '@/utils/formatters'

export function Payslip() {
  const { employee } = useAuth()
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('March')
  const [generated, setGenerated] = useState(false)
  const payslipQuery = useQuery({
    queryKey: ['payroll', 'payslip', year, month],
    queryFn: () => getPayslip(year, month),
    enabled: generated,
  })

  const payslip = payslipQuery.data
  const earnings = payslip?.lines.filter((line) => line.type === 'earning') ?? []
  const deductions = payslip?.lines.filter((line) => line.type === 'deduction') ?? []
  const gross = payslip?.grossPay ?? 0
  const totalDeductions = payslip?.totalDeductions ?? 0
  const net = payslip?.netPay ?? 0

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
                options={payrollYears.map((y) => ({ label: y, value: y }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="month">Period Month</Label>
              <Select
                id="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                options={payrollMonths.map((m) => ({ label: m, value: m }))}
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              className="min-w-[120px] rounded-full"
              onClick={() => setGenerated(true)}
              disabled={payslipQuery.isFetching}
            >
              {payslipQuery.isFetching ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </PortalFormCard>

      {generated && payslipQuery.isError ? (
        <div className="portal-panel mt-6 p-4 text-sm text-red-700">
          Payslip was not found for {month} {year}.
        </div>
      ) : null}

      {generated && payslipQuery.isLoading ? (
        <div className="portal-panel mt-6 p-4 text-sm text-slate-600">Loading payslip...</div>
      ) : null}

      {generated ? (
        payslip ? <div className="portal-panel mt-6 space-y-4 p-4 sm:p-6">
          <div className="border-b border-slate-200 pb-3">
            <p className="text-sm text-slate-600">
              {payslip.employeeNo || employee?.employeeNo} — {payslip.employeeName || employee?.displayName}
            </p>
            <p className="text-lg font-bold text-[var(--portal-navy)]">
              Payslip — {month} {year}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Earnings</p>
              {earnings.map((line) => (
                <div key={line.label} className="flex justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span>{line.label}</span>
                  <span>{formatCurrency(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm font-semibold">
                <span>Gross Pay</span>
                <span>{formatCurrency(gross)}</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Deductions</p>
              {deductions.map((line) => (
                <div key={line.label} className="flex justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span>{line.label}</span>
                  <span className="text-red-600">{formatCurrency(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm font-semibold">
                <span>Total Deductions</span>
                <span className="text-red-600">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between rounded-lg bg-[var(--portal-navy)] px-4 py-3 text-white">
            <span className="font-semibold">Net Pay</span>
            <span className="text-xl font-bold">{formatCurrency(net)}</span>
          </div>
        </div> : null
      ) : null}
    </PageWrapper>
  )
}
