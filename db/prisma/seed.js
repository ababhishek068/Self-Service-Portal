import bcrypt from 'bcryptjs'
import { getPrisma, disconnect } from '../src/client.js'

/**
 * Seed demo staff accounts into the database.
 * Run with:  npm run seed   (inside the db/ folder)
 *
 * Every account uses the password below — change it before any real use.
 */
const DEMO_PASSWORD = 'Password@123'
const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10)

const seeds = [
  { employeeNo: 'HB-02418', name: 'Beza', lastName: 'Yoseff', department: 'BO', phoneNumber: '0911000001', gender: 'Female', hod: true, ceo: true },
  { employeeNo: 'HB-01002', name: 'Mikael', lastName: 'Tadesse', department: 'FIN', phoneNumber: '0911000002', gender: 'Male', hod: true, ceo: false },
  { employeeNo: 'HB-03245', name: 'Yonas', lastName: 'Mekonnen', department: 'FAC', phoneNumber: '0911000003', gender: 'Male', hod: false, ceo: false },
]

async function run() {
  const prisma = getPrisma()
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, ROUNDS)

  for (const spec of seeds) {
    const data = { ...spec, passwordHash, status: 'Active', mustChangePassword: false }
    await prisma.user.upsert({
      where: { employeeNo: spec.employeeNo },
      create: data,
      update: data,
    })
    console.log(`  seeded ${spec.employeeNo} (${spec.name} ${spec.lastName})`)
  }

  console.log(`\nDone. ${seeds.length} users upserted.`)
  console.log(`All demo accounts use password: ${DEMO_PASSWORD}`)
}

run()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(disconnect)
