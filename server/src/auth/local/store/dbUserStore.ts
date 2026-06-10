import type { StoredUser } from '../../../types.js'
import type { UserRepository } from './userRepository.js'

type DbModule = typeof import('@ssp/db')

/**
 * MySQL/Prisma-backed user repository.
 *
 * The `@ssp/db` package is imported lazily so that nothing here forces a
 * database connection (or even loads Prisma) unless this store is actually
 * selected. The public `DbUser` shape already matches `StoredUser`, so the
 * mapping is a straight pass-through.
 */
export class DbUserStore implements UserRepository {
  private dbPromise: Promise<DbModule> | null = null

  private db(): Promise<DbModule> {
    if (!this.dbPromise) {
      this.dbPromise = import('@ssp/db')
    }
    return this.dbPromise
  }

  async findByStaffNo(employeeNo: string): Promise<StoredUser | null> {
    const db = await this.db()
    const user = await db.findUserByStaffNo(employeeNo)
    return user as StoredUser | null
  }

  async list(): Promise<StoredUser[]> {
    const db = await this.db()
    const users = await db.listUsers()
    return users as StoredUser[]
  }

  async listDirectReports(managerEmployeeNo: string): Promise<StoredUser[]> {
    const db = await this.db()
    const users = await db.listUsersByManager(managerEmployeeNo)
    return users as StoredUser[]
  }

  async upsert(user: StoredUser): Promise<StoredUser> {
    const db = await this.db()
    const saved = await db.upsertUser(user)
    return saved as StoredUser
  }

  async updatePassword(employeeNo: string, passwordHash: string): Promise<void> {
    const db = await this.db()
    await db.updatePassword(employeeNo, passwordHash)
  }
}
