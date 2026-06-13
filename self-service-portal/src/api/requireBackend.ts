import { resolveApiBaseUrl } from '@/api/client/authClient'

export const BACKEND_NOT_CONFIGURED =
  'Backend API is not configured. Set VITE_AUTH_API_URL (application login) and/or VITE_BC_API_URL (BC365 login), then restart the dev server.'

/** Ensures an API base URL is configured before making a data request. */
export function requireAuthApiUrl(): string {
  const base = resolveApiBaseUrl()
  if (!base) throw new Error(BACKEND_NOT_CONFIGURED)
  return base
}

export function requireApplicationApiUrl(): string {
  const base = resolveApiBaseUrl('application')
  if (!base) throw new Error(BACKEND_NOT_CONFIGURED)
  return base
}

export function requireBcApiUrl(): string {
  const base = resolveApiBaseUrl('bc365')
  if (!base) throw new Error('BC backend is not configured. Set VITE_BC_API_URL in .env.')
  return base
}
