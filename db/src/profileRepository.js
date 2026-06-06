import { getPrisma } from './client.js'

function iso(value) {
  return value instanceof Date ? value.toISOString() : value
}

function toEmployeeProfile(row) {
  return {
    id: row.id,
    employeeNo: row.employeeNo,
    sector: row.sector,
    division: row.division,
    district: row.district,
    maritalStatus: row.maritalStatus,
    employmentType: row.employmentType,
    dateOfJoin: row.dateOfJoin,
    contractStartDate: row.contractStartDate,
    contractEndDate: row.contractEndDate,
    probationEndDate: row.probationEndDate,
    nextOfKin: row.nextOfKin ?? [],
    employmentHistory: row.employmentHistory ?? [],
    qualifications: row.qualifications ?? [],
    assignedAssets: row.assignedAssets ?? [],
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export async function getEmployeeProfile(employeeNo) {
  const row = await getPrisma().employeeProfile.findUnique({ where: { employeeNo } })
  return row ? toEmployeeProfile(row) : null
}

export async function upsertEmployeeProfile(input) {
  const data = {
    sector: input.sector ?? '',
    division: input.division ?? '',
    district: input.district ?? '',
    maritalStatus: input.maritalStatus ?? '',
    employmentType: input.employmentType ?? '',
    dateOfJoin: input.dateOfJoin ?? '',
    contractStartDate: input.contractStartDate ?? '',
    contractEndDate: input.contractEndDate ?? '',
    probationEndDate: input.probationEndDate ?? '',
    nextOfKin: input.nextOfKin ?? [],
    employmentHistory: input.employmentHistory ?? [],
    qualifications: input.qualifications ?? [],
    assignedAssets: input.assignedAssets ?? [],
  }
  const row = await getPrisma().employeeProfile.upsert({
    where: { employeeNo: input.employeeNo },
    create: { employeeNo: input.employeeNo, ...data },
    update: data,
  })
  return toEmployeeProfile(row)
}
