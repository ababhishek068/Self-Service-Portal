import { getPrisma } from './client.js'

function toAttendanceRecord(row) {
  return {
    id: row.id,
    date: row.date,
    staffName: row.staffName,
    employeeNo: row.employeeNo,
    timeIn: row.timeIn,
    timeOut: row.timeOut ?? '',
    hoursWorked: row.hoursWorked ?? '',
    location: row.location,
    comments: row.comments,
    departmentCode: row.departmentCode,
    departmentName: row.departmentName,
    managerEmployeeNo: row.managerEmployeeNo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listAttendance({ employeeNo, departmentCode } = {}) {
  const rows = await getPrisma().attendanceRecord.findMany({
    where: {
      ...(employeeNo ? { employeeNo } : {}),
      ...(departmentCode ? { departmentCode } : {}),
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.map(toAttendanceRecord)
}

export async function signInAttendance(input) {
  const row = await getPrisma().attendanceRecord.create({
    data: {
      employeeNo: input.employeeNo,
      staffName: input.staffName,
      date: input.date,
      timeIn: input.timeIn,
      location: input.location ?? '',
      comments: input.comments ?? 'Signed in',
      departmentCode: input.departmentCode ?? '',
      departmentName: input.departmentName ?? '',
      managerEmployeeNo: input.managerEmployeeNo ?? '',
    },
  })
  return toAttendanceRecord(row)
}

export async function signOutAttendance({ employeeNo, date, timeOut, hoursWorked }) {
  const row = await getPrisma().attendanceRecord.findFirst({
    where: { employeeNo, date, timeOut: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return null

  const updated = await getPrisma().attendanceRecord.update({
    where: { id: row.id },
    data: {
      timeOut,
      hoursWorked,
      comments: 'Signed out',
    },
  })
  return toAttendanceRecord(updated)
}
