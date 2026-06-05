/**
 * Canonical user shape returned to the frontend after authentication.
 *
 * Both auth providers (local and Business Central) normalise their result to
 * this contract, so the React app never has to care which backend authenticated
 * the user.
 */
export interface AuthUser {
  employeeNo: string
  name: string
  displayName: string
  department: string
  phoneNumber: string
  gender: string
  userCategory: 'staff' | 'farmer'
  HOD: boolean
  CEO: boolean
  mustChangePassword: boolean
}

/** Persisted user record in our own store. Includes the secret hash. */
export interface StoredUser {
  employeeNo: string
  name: string
  lastName: string
  department: string
  phoneNumber: string
  gender: string
  passwordHash: string
  status: 'Active' | 'Inactive' | 'Blocked'
  HOD: boolean
  CEO: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

/** What the JWT carries. Keep it small — it is sent on every request. */
export interface TokenPayload {
  sub: string // employeeNo
  name: string
  CEO: boolean
  HOD: boolean
}

/** A provider either returns a normalised user or throws an AuthError. */
export interface AuthProvider {
  readonly name: string
  authenticate(staffNo: string, password: string): Promise<AuthUser>
}
