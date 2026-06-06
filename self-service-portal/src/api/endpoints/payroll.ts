import { authGet } from '@/api/client/authClient'
import { env } from '@/config/env'

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
  if (env.USE_MOCK || !env.AUTH_API_URL) return null
  return authGet<PayslipResponse>('/api/payroll/payslip', { params: { year, month } })
}

export async function getMasterRoll(year: string, month: string): Promise<MasterRollResponse> {
  if (env.USE_MOCK || !env.AUTH_API_URL) {
    return { rows: [], summary: { headcount: 0, grossPay: 0, totalDeductions: 0, netPay: 0 } }
  }
  return authGet<MasterRollResponse>('/api/payroll/master-roll', { params: { year, month } })
}
