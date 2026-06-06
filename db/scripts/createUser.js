import { parseArgs } from 'node:util'
import bcrypt from 'bcryptjs'
import { upsertUser } from '../src/userRepository.js'
import { disconnect } from '../src/client.js'

/**
 * Create (or update) a single portal user directly in the database.
 *
 * Usage:
 *   npm run create-user -- --staffNo EMP-00123 --name "Jane Doe" --password "Secret@123"
 *
 * Optional flags:
 *   --roles staff,lineManager,hod
 *   --department FIN
 *   --department-name Finance
 *   --email jane@example.com
 *   --branch-code HO
 *   --branch-name "Head Office"
 *   --job-title "Finance Officer"
 *   --job-grade G6
 *   --place-of-duty "Head Office"
 *   --account-number 1000000001
 *   --manager EMP-01002
 *   --leave-balance 16
 *   --responsible-center HO-FIN
 *   --permission-departments FIN,BO
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
    roles: { type: 'string' },
    email: { type: 'string' },
    department: { type: 'string' },
    'department-name': { type: 'string' },
    'branch-code': { type: 'string' },
    'branch-name': { type: 'string' },
    'job-title': { type: 'string' },
    'job-grade': { type: 'string' },
    'place-of-duty': { type: 'string' },
    'account-number': { type: 'string' },
    manager: { type: 'string' },
    'leave-balance': { type: 'string' },
    'responsible-center': { type: 'string' },
    'permission-departments': { type: 'string' },
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
  console.error('Usage: npm run create-user -- --staffNo EMP-00123 --name "Jane Doe" --password "Secret@123" [--department FIN] [--ceo] [--hod]')
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
    roles: values.roles ? values.roles.split(',').map((item) => item.trim()).filter(Boolean) : ['staff'],
    email: values.email ?? '',
    department: values.department ?? '',
    departmentName: values['department-name'] ?? '',
    branchCode: values['branch-code'] ?? '',
    branchName: values['branch-name'] ?? '',
    jobTitle: values['job-title'] ?? '',
    jobGrade: values['job-grade'] ?? '',
    placeOfDuty: values['place-of-duty'] ?? '',
    accountNumber: values['account-number'] ?? '',
    managerEmployeeNo: values.manager ?? '',
    leaveBalance: Number(values['leave-balance'] ?? 0),
    responsibleCenter: values['responsible-center'] ?? '',
    permissionDepartments: values['permission-departments']
      ? values['permission-departments'].split(',').map((item) => item.trim()).filter(Boolean)
      : [],
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
