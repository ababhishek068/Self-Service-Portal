import type { StoredUser } from '../../../types.js'

/**
 * Storage-agnostic contract for the user table. Implemented by both the JSON
 * file store (no DB needed) and the MySQL/Prisma store (`@ssp/db`). The rest of
 * the app depends only on this interface, so swapping engines changes nothing
 * upstream.
 */
export interface UserRepository {
  findByStaffNo(employeeNo: string): Promise<StoredUser | null>
  list(): Promise<StoredUser[]>
  upsert(user: StoredUser): Promise<StoredUser>
  updatePassword(employeeNo: string, passwordHash: string): Promise<void>
}
