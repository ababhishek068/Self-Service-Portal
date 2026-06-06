import { useState } from 'react'
import { Download } from 'lucide-react'
import { getMasterRoll, type PayslipResponse, type MasterRollResponse } from '@/api/endpoints/payroll'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { payrollMonths, payrollYears } from '@/data/payroll'
import { formatCurrency } from '@/utils/formatters'

const columns: DataTableColumn<PayslipResponse>[] = [
  { id: 'employeeNo', header: 'Employee No.', cell: (row) => row.employeeNo },
  { id: 'employeeName', header: 'Employee', cell: (row) => row.employeeName },
  { id: 'department', header: 'Department', cell: (row) => row.departmentName || row.departmentCode },
  { id: 'gross', header: 'Gross Pay', cell: (row) => formatCurrency(row.grossPay) },
  { id: 'deductions', header: 'Deductions', cell: (row) => formatCurrency(row.totalDeductions) },
  { id: 'net', header: 'Net Pay', cell: (row) => formatCurrency(row.netPay) },
]

export function MasterRoll() {
  const [year, setYear] = useState<string>('2026')
  const [month, setMonth] = useState<string>('March')
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState<MasterRollResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!year || !month) return
    setSubmitting(true)
    setError(null)
    try {
      setReport(await getMasterRoll(year, month))
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Unable to generate master roll.')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCsv = () => {
    if (!report) return
    const header = ['Employee No.', 'Employee', 'Department', 'Gross Pay', 'Deductions', 'Net Pay']
    const rows = report.rows.map((row) => [
      row.employeeNo,
      row.employeeName,
      row.departmentName || row.departmentCode,
      String(row.grossPay),
      String(row.totalDeductions),
      String(row.netPay),
    ])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `master-roll-${month}-${year}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <PageWrapper title="Payroll Master Roll" description="Generate the consolidated payroll master roll report.">
      <form
        onSubmit={generate}
        className="portal-form-card mx-auto w-full max-w-2xl"
      >
        <div className="portal-form-card-header relative px-4 py-3 text-center text-sm font-semibold tracking-wide text-white sm:text-base">
          Generate Master Roll
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ceoYear">Year</Label>
              <Select
                id="ceoYear"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="Select year"
                options={payrollYears.map((y) => ({ value: y, label: y }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ceoMonth">Month</Label>
              <Select
                id="ceoMonth"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="Select month"
                options={payrollMonths.map((m) => ({ value: m, label: m }))}
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit" variant="accent" className="rounded-full" disabled={submitting || !month}>
              <Download className="h-4 w-4" />
              {submitting ? 'Generating…' : 'Generate report'}
            </Button>
          </div>
        </div>
      </form>

      {error ? <div className="portal-panel mx-auto mt-6 max-w-2xl p-4 text-sm text-red-700">{error}</div> : null}

      {report ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="portal-card p-4">
              <p className="text-xs text-slate-500">Headcount</p>
              <p className="text-lg font-semibold text-[var(--portal-navy)]">{report.summary.headcount}</p>
            </div>
            <div className="portal-card p-4">
              <p className="text-xs text-slate-500">Gross Pay</p>
              <p className="text-lg font-semibold text-[var(--portal-navy)]">{formatCurrency(report.summary.grossPay)}</p>
            </div>
            <div className="portal-card p-4">
              <p className="text-xs text-slate-500">Deductions</p>
              <p className="text-lg font-semibold text-[var(--portal-navy)]">{formatCurrency(report.summary.totalDeductions)}</p>
            </div>
            <div className="portal-card p-4">
              <p className="text-xs text-slate-500">Net Pay</p>
              <p className="text-lg font-semibold text-[var(--portal-navy)]">{formatCurrency(report.summary.netPay)}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" className="rounded-full" onClick={downloadCsv}>
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
          <DataTable
            rows={report.rows}
            columns={columns}
            getRowId={(row) => row.id}
            emptyTitle="No payroll rows found for this period"
            compact
          />
        </div>
      ) : null}
    </PageWrapper>
  )
}
