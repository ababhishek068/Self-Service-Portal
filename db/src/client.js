import { PrismaClient } from '@prisma/client'

/**
 * Lazily-created Prisma client singleton. We create it on first use so that
 * simply importing this package (e.g. in JSON-store mode) never forces a
 * database connection.
 */
let prisma

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export async function disconnect() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = undefined
  }
}
