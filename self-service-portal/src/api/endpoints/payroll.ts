import { authGet } from '@/api/client/authClient'
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
