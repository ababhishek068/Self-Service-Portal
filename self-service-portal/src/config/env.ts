const read = (key: string, fallback = '') => import.meta.env[key] ?? fallback

const bool = (value: string | boolean | undefined, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === '') return fallback
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

export const env = {
  ERP_BASE_URL: read('VITE_ERP_BASE_URL'),
  TOKEN_URL: read('VITE_TOKEN_URL'),
  CLIENT_ID: read('VITE_CLIENT_ID'),
  CLIENT_SECRET: read('VITE_CLIENT_SECRET'),
  SCOPE: read('VITE_SCOPE', 'https://api.businesscentral.dynamics.com/.default'),
  APP_NAME: read('VITE_APP_NAME', 'Self Service Portal'),
  USE_MOCK: bool(import.meta.env.VITE_USE_MOCK, true),
  ERP_COMPANY_ID: read('VITE_ERP_COMPANY_ID'),
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
