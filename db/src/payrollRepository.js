import { getPrisma } from './client.js'

function iso(value) {
  return value instanceof Date ? value.toISOString() : value
}

function toPayrollSlip(row) {
  return {
    id: row.id,
    employeeNo: row.employeeNo,
    employeeName: row.employeeName,
    departmentCode: row.departmentCode,
    departmentName: row.departmentName,
    year: row.year,
    month: row.month,
    grossPay: row.grossPay,
    totalDeductions: row.totalDeductions,
    netPay: row.netPay,
    lines: row.lines ?? [],
    generatedAt: iso(row.generatedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export async function getPayrollSlip({ employeeNo, year, month }) {
  const row = await getPrisma().payrollSlip.findUnique({
    where: {
      employeeNo_year_month: {
        employeeNo,
        year: Number(year),
        month,
      },
    },
  })
  return row ? toPayrollSlip(row) : null
}

export async function listPayrollSlips({ year, month, employeeNo } = {}) {
  const rows = await getPrisma().payrollSlip.findMany({
    where: {
      ...(year ? { year: Number(year) } : {}),
      ...(month ? { month } : {}),
      ...(employeeNo ? { employeeNo } : {}),
    },
    orderBy: [{ departmentCode: 'asc' }, { employeeNo: 'asc' }],
  })
  return rows.map(toPayrollSlip)
}

export async function upsertPayrollSlip(input) {
  const grossPay = Number(input.grossPay ?? 0)
  const totalDeductions = Number(input.totalDeductions ?? 0)
  const netPay = Number(input.netPay ?? grossPay - totalDeductions)
  const data = {
    employeeName: input.employeeName,
    departmentCode: input.departmentCode ?? '',
    departmentName: input.departmentName ?? '',
    grossPay,
    totalDeductions,
    netPay,
    lines: input.lines ?? [],
    generatedAt: input.generatedAt ? new Date(input.generatedAt) : new Date(),
  }

  const row = await getPrisma().payrollSlip.upsert({
    where: {
      employeeNo_year_month: {
        employeeNo: input.employeeNo,
        year: Number(input.year),
        month: input.month,
      },
    },
    create: {
      employeeNo: input.employeeNo,
      year: Number(input.year),
      month: input.month,
      ...data,
    },
    update: data,
  })
  return toPayrollSlip(row)
}
