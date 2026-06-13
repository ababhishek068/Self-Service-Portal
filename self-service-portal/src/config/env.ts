const read = (key: string, fallback = '') => import.meta.env[key] ?? fallback

export const env = {
  /**
   * Base URL of the Node JWT + portal API (application-user login).
   */
  AUTH_API_URL: read('VITE_AUTH_API_URL'),
  AUTH_API_PORT: read('VITE_AUTH_API_PORT'),

  /**
   * Business Central ERP backend (BC365 sign-in).
   * Defaults to AUTH_API_URL when unset (single-backend setups).
   */
  BC_API_URL: read('VITE_BC_API_URL'),
  BC_API_PORT: read('VITE_BC_API_PORT'),

  /** Legacy Laravel ESS — not used when AUTH_API_URL is set. */
  ESS_API_URL: read('VITE_ESS_API_URL'),

  /** Legacy Business Central direct-connection vars. */
  ERP_BASE_URL: read('VITE_ERP_BASE_URL'),
  TOKEN_URL: read('VITE_TOKEN_URL'),
  CLIENT_ID: read('VITE_CLIENT_ID'),
  CLIENT_SECRET: read('VITE_CLIENT_SECRET'),
  SCOPE: read('VITE_SCOPE', 'https://api.businesscentral.dynamics.com/.default'),
  ERP_COMPANY_ID: read('VITE_ERP_COMPANY_ID'),

  APP_NAME: read('VITE_APP_NAME', 'Self Service Portal'),
} as const

export type Env = typeof env

export function assertRealErpConfig() {
  const missing = Object.entries({
    VITE_ERP_BASE_URL: env.ERP_BASE_URL,
    VITE_TOKEN_URL: env.TOKEN_URL,
    VITE_CLIENT_ID: env.CLIENT_ID,
    VITE_CLIENT_SECRET: env.CLIENT_SECRET,
    VITE_SCOPE: env.SCOPE,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`ERP connector is missing required env vars: ${missing.join(', ')}`)
  }
}
