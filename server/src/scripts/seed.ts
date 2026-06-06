import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { userStore } from '../auth/local/store/index.js'
import type { StoredUser } from '../types.js'

/**
 * Seed demo staff accounts into the local user store.
 * Run with:  npm run seed
 *
 * Keep in sync with db/prisma/seed.js — that script is the canonical source
 * when USER_STORE=db. This script is a convenience wrapper for the same users.
 */
const DEMO_PASSWORD = 'Password@123'

interface SeedSpec {
  employeeNo: string
  name: string
  lastName: string
  roles: string[]
  email: string
  department: string
  departmentName: string
  branchCode: string
  branchName: string
  jobTitle: string
  jobGrade: string
  placeOfDuty: string
  accountNumber: string
  managerEmployeeNo: string
  leaveBalance: number
  responsibleCenter: string
  permissionDepartments: string[]
  phoneNumber: string
  gender: string
  HOD: boolean
  CEO: boolean
  /** Override the default demo password for a single account. */
  password?: string
}

const seeds: SeedSpec[] = [
  {
    employeeNo: 'EMP-02418',
    name: 'Admin',
    lastName: 'User',
    roles: ['staff', 'hod', 'ictAdmin', 'ceo'],
    email: 'admin@example.com',
    department: 'BO',
    departmentName: 'Branch Operations',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Senior Operations Officer',
    jobGrade: 'G7',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459922',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 16,
    responsibleCenter: 'HO-BO',
    permissionDepartments: ['BO'],
    phoneNumber: '0911000001',
    gender: 'Male',
    HOD: true,
    CEO: true,
  },
  {
    employeeNo: 'EMP-01002',
    name: 'Manager',
    lastName: 'User',
    roles: ['staff', 'lineManager', 'hod'],
    email: 'manager@example.com',
    department: 'FIN',
    departmentName: 'Finance',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Finance Manager',
    jobGrade: 'G8',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459923',
    managerEmployeeNo: 'EMP-02418',
    leaveBalance: 18,
    responsibleCenter: 'HO-FIN',
    permissionDepartments: ['FIN', 'BO'],
    phoneNumber: '0911000002',
    gender: 'Female',
    HOD: true,
    CEO: false,
  },
  {
    employeeNo: 'EMP-03245',
    name: 'Staff',
    lastName: 'User',
    roles: ['staff'],
    email: 'staff@example.com',
    department: 'FAC',
    departmentName: 'Facility Management',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Facility Officer',
    jobGrade: 'G5',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459924',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 12,
    responsibleCenter: 'HO-FAC',
    permissionDepartments: ['FAC'],
    phoneNumber: '0911000003',
    gender: 'Male',
    HOD: false,
    CEO: false,
  },
  {
    employeeNo: 'HB-00123',
    name: 'Abhishek',
    lastName: 'Behera',
    roles: ['staff'],
    email: '',
    department: 'FIN',
    departmentName: 'Finance',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Finance Officer',
    jobGrade: 'G6',
    placeOfDuty: 'Head Office',
    accountNumber: '',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 0,
    responsibleCenter: 'HO-FIN',
    permissionDepartments: ['FIN'],
    phoneNumber: '',
    gender: 'Male',
    HOD: false,
    CEO: false,
    password: 'Secret@123',
  },
]

async function run() {
  const now = new Date().toISOString()

  for (const spec of seeds) {
    const { password: accountPassword, ...userSpec } = spec
    const passwordHash = await bcrypt.hash(accountPassword ?? DEMO_PASSWORD, env.BCRYPT_ROUNDS)
    const user: StoredUser = {
      ...userSpec,
      passwordHash,
      status: 'Active',
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    }
    await userStore.upsert(user)
    console.log(`  seeded ${spec.employeeNo} (${spec.name} ${spec.lastName})`)
  }

  const target = env.USER_STORE === 'db' ? 'database user store' : env.USER_STORE_PATH
  console.log(`\nDone. ${seeds.length} users written to ${target}`)
  console.log(`Default demo password: ${DEMO_PASSWORD}`)
  console.log('HB-00123 uses password: Secret@123')
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
