import { authGet, authHttp } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface PayslipLine {
  label: string
  amount: number
  type: 'earning' | 'deduction'
}

export interface PayslipResponse {
  id: string
  employeeNo: string
  employeeName: string
  departmentCode: string
  departmentName: string
  year: number
  month: string
  grossPay: number
  totalDeductions: number
  netPay: number
  lines: PayslipLine[]
  generatedAt: string
}

export interface MasterRollResponse {
  rows: PayslipResponse[]
  summary: {
    headcount: number
    grossPay: number
    totalDeductions: number
    netPay: number
  }
}

export async function getPayslip(year: string, month: string): Promise<PayslipResponse | null> {
  requireAuthApiUrl()
  return authGet<PayslipResponse>('/api/payroll/payslip', { params: { year, month } })
}

export async function getMasterRoll(year: string, month: string): Promise<MasterRollResponse> {
  requireAuthApiUrl()
  return authGet<MasterRollResponse>('/api/payroll/master-roll', { params: { year, month } })
}

export interface PayrollPeriod {
  year: number
  month: string
}

export async function listPayrollPeriods(): Promise<PayrollPeriod[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: PayrollPeriod[] }>('/api/payroll/periods')
  return rows
}

export async function downloadPayslipPdf(year: string, month: string): Promise<void> {
  requireAuthApiUrl()
  const response = await authHttp.get<Blob>('/api/payroll/payslip/pdf', {
    params: { year, month },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `payslip-${month}-${year}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadMasterRollPdf(
  year: string,
  month: string,
  postingGroup = '',
): Promise<void> {
  requireAuthApiUrl()
  const response = await authHttp.get<Blob>('/api/payroll/master-roll/pdf', {
    params: { year, month, postingGroup },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `master-roll-${month}-${year}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
