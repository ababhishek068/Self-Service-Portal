import { disconnect, getPrisma } from '../src/client.js'

/**
 * Reset leave management data:
 * - Deletes all leave portal requests
 * - Restores annual leave allocations on user records
 *
 * Run with: npm run reset:leave   (inside the db/ folder)
 */
const ANNUAL_LEAVE_ALLOCATION = 21

async function run() {
  const prisma = getPrisma()

  const deleted = await prisma.portalRequest.deleteMany({
    where: { requestType: 'leave' },
  })

  const updated = await prisma.user.updateMany({
    where: { leaveBalance: { lte: 0 } },
    data: { leaveBalance: ANNUAL_LEAVE_ALLOCATION },
  })

  console.log(`Deleted ${deleted.count} leave request(s).`)
  console.log(`Updated ${updated.count} user(s) with annual leave allocation of ${ANNUAL_LEAVE_ALLOCATION} days.`)
  console.log('Leave management data reset complete.')
}

run()
  .catch((err) => {
    console.error('Leave reset failed:', err)
    process.exitCode = 1
  })
  .finally(disconnect)
