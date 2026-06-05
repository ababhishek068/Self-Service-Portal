import { env } from '../config/env.js'
import { LocalAuthProvider } from './local/index.js'
import { BusinessCentralAuthProvider } from './bc/index.js'
import type { AuthProvider } from '../types.js'

/**
 * Two login strategies, each isolated in its own folder:
 *   ./local  → "our backend" (way #2, works now)
 *   ./bc     → Business Central (way #1, stub for now)
 */
const providers: Record<string, AuthProvider> = {
  local: new LocalAuthProvider(),
  bc: new BusinessCentralAuthProvider(),
}

/**
 * Resolve the active auth provider from configuration. Switching between
 * "our backend" (local) and "Business Central" (bc) is a single env var:
 *     AUTH_PROVIDER=local | bc
 */
export function getAuthProvider(): AuthProvider {
  const provider = providers[env.AUTH_PROVIDER]
  if (!provider) {
    throw new Error(`Unknown AUTH_PROVIDER "${env.AUTH_PROVIDER}". Use "local" or "bc".`)
  }
  return provider
}
