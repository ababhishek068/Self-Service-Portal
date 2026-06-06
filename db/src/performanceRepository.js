import { getPrisma } from './client.js'

function iso(value) {
  return value instanceof Date ? value.toISOString() : value
}

function toPerformanceReview(row) {
  return {
    id: row.id,
    employeeNo: row.employeeNo,
    employeeName: row.employeeName,
    period: row.period,
    supervisorEmployeeNo: row.supervisorEmployeeNo,
    supervisorName: row.supervisorName,
    departmentCode: row.departmentCode,
    departmentName: row.departmentName,
    status: row.status,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export async function listPerformanceReviews({ employeeNo, departmentCode } = {}) {
  const rows = await getPrisma().performanceReview.findMany({
    where: {
      ...(employeeNo ? { employeeNo } : {}),
      ...(departmentCode ? { departmentCode } : {}),
    },
    orderBy: [{ period: 'desc' }, { employeeNo: 'asc' }],
  })
  return rows.map(toPerformanceReview)
}

export async function upsertPerformanceReview(input) {
  const data = {
    employeeName: input.employeeName,
    supervisorEmployeeNo: input.supervisorEmployeeNo ?? '',
    supervisorName: input.supervisorName ?? '',
    departmentCode: input.departmentCode ?? '',
    departmentName: input.departmentName ?? '',
    status: input.status ?? 'Open',
  }
  const row = await getPrisma().performanceReview.upsert({
    where: {
      employeeNo_period: {
        employeeNo: input.employeeNo,
        period: input.period,
      },
    },
    create: {
      employeeNo: input.employeeNo,
      period: input.period,
      ...data,
    },
    update: data,
  })
  return toPerformanceReview(row)
}
