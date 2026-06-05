import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { userStore } from '../auth/local/store/index.js'
import type { StoredUser } from '../types.js'

/**
 * Seed demo staff accounts into the local user store.
 * Run with:  npm run seed
 *
 * Every account uses the password below — change it before any real use.
 */
const DEMO_PASSWORD = 'Password@123'

interface SeedSpec {
  employeeNo: string
  name: string
  lastName: string
  department: string
  phoneNumber: string
  gender: string
  HOD: boolean
  CEO: boolean
}

const seeds: SeedSpec[] = [
  { employeeNo: 'HB-02418', name: 'Admin', lastName: 'User', department: 'BO', phoneNumber: '0911000001', gender: '', HOD: true, CEO: true },
  { employeeNo: 'HB-01002', name: 'Manager', lastName: 'User', department: 'FIN', phoneNumber: '0911000002', gender: '', HOD: true, CEO: false },
  { employeeNo: 'HB-03245', name: 'Staff', lastName: 'User', department: 'FAC', phoneNumber: '0911000003', gender: '', HOD: false, CEO: false },
]

async function run() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.BCRYPT_ROUNDS)
  const now = new Date().toISOString()

  for (const spec of seeds) {
    const user: StoredUser = {
      ...spec,
      passwordHash,
      status: 'Active',
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    }
    await userStore.upsert(user)
    console.log(`  seeded ${spec.employeeNo} (${spec.name} ${spec.lastName})`)
  }

  console.log(`\nDone. ${seeds.length} users written to ${env.USER_STORE_PATH}`)
  console.log(`All demo accounts use password: ${DEMO_PASSWORD}`)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
