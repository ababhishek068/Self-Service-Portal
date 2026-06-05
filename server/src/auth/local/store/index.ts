import { env } from '../../../config/env.js'
import { DbUserStore } from './dbUserStore.js'
import { JsonUserStore } from './jsonUserStore.js'
import type { UserRepository } from './userRepository.js'

/**
 * Active user store, chosen by configuration:
 *   USER_STORE=db   → MySQL via Prisma (@ssp/db)   [requires DATABASE_URL]
 *   USER_STORE=json → local JSON file              [no database needed]
 *
 * When unset, we use the DB whenever DATABASE_URL is present, else JSON.
 */
export const userStore: UserRepository =
  env.USER_STORE === 'db' ? new DbUserStore() : new JsonUserStore(env.USER_STORE_PATH)

export type { UserRepository } from './userRepository.js'
