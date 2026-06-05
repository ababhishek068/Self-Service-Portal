import { getPrisma } from './client.js'

/**
 * Map a Prisma `User` row to the public `DbUser` shape consumed by the backend.
 * Notably normalises `hod`/`ceo` → `HOD`/`CEO` and dates → ISO strings, so the
 * rest of the app never imports Prisma types.
 */
function toDbUser(row) {
  return {
    employeeNo: row.employeeNo,
    name: row.name,
    lastName: row.lastName,
    department: row.department,
    phoneNumber: row.phoneNumber,
    gender: row.gender,
    passwordHash: row.passwordHash,
    status: row.status,
    HOD: row.hod,
    CEO: row.ceo,
    mustChangePassword: row.mustChangePassword,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function findUserByStaffNo(employeeNo) {
  const row = await getPrisma().user.findUnique({ where: { employeeNo } })
  return row ? toDbUser(row) : null
}

export async function listUsers() {
  const rows = await getPrisma().user.findMany({ orderBy: { employeeNo: 'asc' } })
  return rows.map(toDbUser)
}

export async function upsertUser(input) {
  const data = {
    name: input.name,
    lastName: input.lastName ?? '',
    department: input.department ?? '',
    phoneNumber: input.phoneNumber ?? '',
    gender: input.gender ?? '',
    passwordHash: input.passwordHash,
    status: input.status ?? 'Active',
    hod: Boolean(input.HOD),
    ceo: Boolean(input.CEO),
    mustChangePassword: Boolean(input.mustChangePassword),
  }
  const row = await getPrisma().user.upsert({
    where: { employeeNo: input.employeeNo },
    create: { employeeNo: input.employeeNo, ...data },
    update: data,
  })
  return toDbUser(row)
}

export async function updatePassword(employeeNo, passwordHash) {
  await getPrisma().user.update({
    where: { employeeNo },
    data: { passwordHash, mustChangePassword: false },
  })
}
