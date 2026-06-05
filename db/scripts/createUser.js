import { parseArgs } from 'node:util'
import bcrypt from 'bcryptjs'
import { upsertUser } from '../src/userRepository.js'
import { disconnect } from '../src/client.js'

/**
 * Create (or update) a single portal user directly in the database.
 *
 * Usage:
 *   npm run create-user -- --staffNo HB-00123 --name "Jane Doe" --password "Secret@123"
 *
 * Optional flags:
 *   --department FIN
 *   --phone 0911000000
 *   --gender Female
 *   --ceo            (grant CEO function access)
 *   --hod            (grant HOD function access)
 *   --must-change    (force password change on first login)
 *   --status Active|Inactive|Blocked   (default Active)
 *   --rounds 10      (bcrypt cost factor)
 */
const { values } = parseArgs({
  options: {
    staffNo: { type: 'string' },
    name: { type: 'string' },
    lastName: { type: 'string' },
    password: { type: 'string' },
    department: { type: 'string' },
    phone: { type: 'string' },
    gender: { type: 'string' },
    status: { type: 'string' },
    ceo: { type: 'boolean' },
    hod: { type: 'boolean' },
    'must-change': { type: 'boolean' },
    rounds: { type: 'string' },
  },
})

function fail(message) {
  console.error(`Error: ${message}\n`)
  console.error('Usage: npm run create-user -- --staffNo HB-00123 --name "Jane Doe" --password "Secret@123" [--department FIN] [--ceo] [--hod]')
  process.exit(1)
}

if (!values.staffNo) fail('--staffNo is required')
if (!values.name) fail('--name is required')
if (!values.password) fail('--password is required')
if (values.password.length < 8) fail('--password must be at least 8 characters')

// Split "First Last" into name + lastName when --lastName isn't given.
let firstName = values.name
let lastName = values.lastName ?? ''
if (!values.lastName && values.name.includes(' ')) {
  const parts = values.name.trim().split(/\s+/)
  firstName = parts.shift() ?? values.name
  lastName = parts.join(' ')
}

async function run() {
  const rounds = Number(values.rounds ?? 10)
  const passwordHash = await bcrypt.hash(values.password, rounds)

  const user = await upsertUser({
    employeeNo: values.staffNo,
    name: firstName,
    lastName,
    department: values.department ?? '',
    phoneNumber: values.phone ?? '',
    gender: values.gender ?? '',
    passwordHash,
    status: values.status ?? 'Active',
    HOD: Boolean(values.hod),
    CEO: Boolean(values.ceo),
    mustChangePassword: Boolean(values['must-change']),
  })

  console.log(`User saved: ${user.employeeNo} — ${user.name} ${user.lastName}`.trim())
  console.log(`  status=${user.status}  CEO=${user.CEO}  HOD=${user.HOD}  mustChangePassword=${user.mustChangePassword}`)
}

run()
  .catch((err) => {
    console.error('Failed to create user:', err.message ?? err)
    process.exitCode = 1
  })
  .finally(disconnect)
