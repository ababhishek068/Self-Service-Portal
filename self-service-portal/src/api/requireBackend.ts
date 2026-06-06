import { env } from '@/config/env'

export const BACKEND_NOT_CONFIGURED =
  'Backend API is not configured. Set VITE_AUTH_API_URL to your server URL (e.g. http://localhost:4000 or your Vercel server URL) and redeploy.'

/** Ensures the Node auth/portal API is configured before making a data request. */
export function requireAuthApiUrl(): string {
  if (!env.AUTH_API_URL) throw new Error(BACKEND_NOT_CONFIGURED)
  return env.AUTH_API_URL
}
