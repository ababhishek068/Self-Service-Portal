import 'dotenv/config'

/**
 * Centralised, validated environment configuration for the backend.
 * Fail fast at boot if something critical (like the JWT secret in production)
 * is missing.
 */

type AuthProvider = 'local' | 'bc'

function str(key: string, fallback = ''): string {
  const value = process.env[key]
  return value === undefined || value === '' ? fallback : value
}

function num(key: string, fallback: number): number {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function list(key: string, fallback: string[]): string[] {
  const value = process.env[key]
  if (!value) return fallback
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const NODE_ENV = str('NODE_ENV', 'development')
const isProd = NODE_ENV === 'production'
const AUTH_PROVIDER = str('AUTH_PROVIDER', 'local') as AuthProvider
const USER_STORE = (str('USER_STORE') || (process.env.DATABASE_URL ? 'db' : 'json')) as 'db' | 'json'

const JWT_SECRET = str('JWT_SECRET', isProd ? '' : 'dev-only-insecure-secret-change-me')
if (isProd && !JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production. Refusing to start with a default secret.')
}

if (USER_STORE === 'db' && !str('DATABASE_URL')) {
  throw new Error('DATABASE_URL must be set when USER_STORE=db.')
}

export const env = {
  NODE_ENV,
  isProd,

  PORT: num('PORT', 4000),
  HOST: str('HOST', '0.0.0.0'),

  /** Which login strategy is active. 'local' = our own user table (now). 'bc' = Business Central (later). */
  AUTH_PROVIDER,

  JWT_SECRET,
  /** Access-token lifetime, e.g. "8h", "30m". */
  JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '8h'),

  /**
   * Which user store backs login:
   *   'db'   → MySQL via Prisma (@ssp/db)  [needs DATABASE_URL]
   *   'json' → local JSON file
   * Defaults to 'db' when DATABASE_URL is set, otherwise 'json'.
   */
  USER_STORE,

  /** MySQL connection string (consumed by @ssp/db / Prisma). */
  DATABASE_URL: str('DATABASE_URL'),

  /** Where the JSON user store lives, relative to the server working directory. */
  USER_STORE_PATH: str('USER_STORE_PATH', './data/users.json'),

  /** bcrypt cost factor. 10–12 is a sane range. */
  BCRYPT_ROUNDS: num('BCRYPT_ROUNDS', 10),

  /** Origins allowed to call this API (the React app's URL[s]). */
  CORS_ORIGINS: list('CORS_ORIGINS', [
    'http://localhost:4000',
    'http://localhost:5173',
    'http://localhost:4173',
  ]),

  /** Business Central connection (only used when AUTH_PROVIDER=bc). */
  BC_BASE_URL: str('BC_BASE_URL'),
  BC_COMPANY_ID: str('BC_COMPANY_ID'),
  BC_USERNAME: str('BC_USERNAME'),
  BC_PASSWORD: str('BC_PASSWORD'),
} as const

export type Env = typeof env
