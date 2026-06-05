/**
 * Public type surface of the @ssp/db package.
 *
 * The backend depends only on these plain types — never on Prisma's generated
 * client — so the database engine stays an internal implementation detail.
 */

export type UserStatus = 'Active' | 'Inactive' | 'Blocked'

export interface DbUser {
  employeeNo: string
  name: string
  lastName: string
  department: string
  phoneNumber: string
  gender: string
  passwordHash: string
  status: UserStatus
  HOD: boolean
  CEO: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

/** Fields accepted when creating/updating a user. */
export interface UpsertUserInput {
  employeeNo: string
  name: string
  lastName?: string
  department?: string
  phoneNumber?: string
  gender?: string
  passwordHash: string
  status?: UserStatus
  HOD?: boolean
  CEO?: boolean
  mustChangePassword?: boolean
}

export function findUserByStaffNo(employeeNo: string): Promise<DbUser | null>
export function listUsers(): Promise<DbUser[]>
export function upsertUser(input: UpsertUserInput): Promise<DbUser>
export function updatePassword(employeeNo: string, passwordHash: string): Promise<void>

/**
 * Low-level escape hatch returning the underlying Prisma client. Typed as
 * `unknown` on purpose so consumers don't take a compile-time dependency on
 * Prisma's generated types — cast it where you genuinely need raw access.
 */
export function getPrisma(): unknown
export function disconnect(): Promise<void>
