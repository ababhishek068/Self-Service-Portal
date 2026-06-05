import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { StoredUser } from '../../../types.js'
import type { UserRepository } from './userRepository.js'

/**
 * File-backed user repository (no database required).
 *
 * Passwords are stored only as bcrypt hashes. Useful for local development and
 * demos where standing up MySQL is overkill. For real deployments configure
 * `DATABASE_URL` to switch to the Prisma/MySQL store instead.
 */
export class JsonUserStore implements UserRepository {
  private readonly filePath: string
  private cache: Map<string, StoredUser> | null = null

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath)
  }

  private async load(): Promise<Map<string, StoredUser>> {
    if (this.cache) return this.cache
    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const rows = JSON.parse(raw) as StoredUser[]
      this.cache = new Map(rows.map((u) => [u.employeeNo, u]))
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        this.cache = new Map()
      } else {
        throw err
      }
    }
    return this.cache
  }

  private async persist(): Promise<void> {
    const rows = [...(this.cache?.values() ?? [])]
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(rows, null, 2), 'utf8')
  }

  async findByStaffNo(employeeNo: string): Promise<StoredUser | null> {
    const users = await this.load()
    return users.get(employeeNo) ?? null
  }

  async list(): Promise<StoredUser[]> {
    const users = await this.load()
    return [...users.values()]
  }

  async upsert(user: StoredUser): Promise<StoredUser> {
    const users = await this.load()
    users.set(user.employeeNo, user)
    await this.persist()
    return user
  }

  async updatePassword(employeeNo: string, passwordHash: string): Promise<void> {
    const users = await this.load()
    const user = users.get(employeeNo)
    if (!user) return
    user.passwordHash = passwordHash
    user.mustChangePassword = false
    user.updatedAt = new Date().toISOString()
    await this.persist()
  }
}
