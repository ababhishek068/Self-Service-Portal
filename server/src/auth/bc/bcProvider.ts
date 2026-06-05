import { AppError, AuthError } from '../../errors.js'
import { env } from '../../config/env.js'
import type { AuthProvider, AuthUser } from '../../types.js'

/**
 * Way #1 — Business Central login (NOT finished yet).
 *
 * This is a stub that documents the intended flow. When the BC web services
 * are ready, implement `authenticate()` to:
 *   1. Look up the employee by `No` via the HREmployee OData/SOAP web service.
 *   2. Verify the account is Active and the password matches BC's PortalPassword.
 *   3. Load the User Setup record to resolve CEO/HOD flags.
 *   4. Map the BC payload into the shared `AuthUser` contract below.
 *
 * Reference implementation already drafted in PHP:
 *   backend-integration/laravel/app/Http/Controllers/Api/AuthApiController.php
 */
export class BusinessCentralAuthProvider implements AuthProvider {
  readonly name = 'bc'

  async authenticate(_staffNo: string, _password: string): Promise<AuthUser> {
    if (!env.BC_BASE_URL) {
      throw new AppError(
        'Business Central login is not configured yet. Set AUTH_PROVIDER=local or finish the BC integration.',
        501,
        'BC_NOT_IMPLEMENTED',
      )
    }

    // TODO: call BC web services here. Until then, fail closed.
    throw new AuthError(
      'Business Central login is not implemented yet.',
      501,
      'BC_NOT_IMPLEMENTED',
    )
  }
}
