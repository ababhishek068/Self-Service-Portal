import bcrypt from 'bcryptjs'
import { AuthError } from '../../errors.js'
import { userStore } from './store/index.js'
import type { AuthProvider, AuthUser, StoredUser } from '../../types.js'

/**
 * Way #2 — "our backend" login.
 *
 * Verifies the staff number + password against our own user table. Passwords
 * are checked against a bcrypt hash; the plaintext never touches disk.
 */
export class LocalAuthProvider implements AuthProvider {
  readonly name = 'local'

  async authenticate(staffNo: string, password: string): Promise<AuthUser> {
    const user = await userStore.findByStaffNo(staffNo)

    // Always run a bcrypt compare (even on a missing user) so response timing
    // doesn't reveal whether the staff number exists.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva'
    const ok = await bcrypt.compare(password, hash)

    if (!user || !ok) {
      throw new AuthError('Staff No or password is incorrect')
    }

    if (user.status !== 'Active') {
      throw new AuthError(
        'Your account is currently blocked or inactive. Please contact the IT team for help.',
        403,
        'ACCOUNT_INACTIVE',
      )
    }

    return toAuthUser(user)
  }
}

export function toAuthUser(user: StoredUser): AuthUser {
  return {
    employeeNo: user.employeeNo,
    name: user.name,
    displayName: `${user.name} ${user.lastName}`.trim(),
    roles: user.roles ?? [],
    email: user.email ?? '',
    department: user.department,
    departmentName: user.departmentName ?? '',
    branchCode: user.branchCode ?? '',
    branchName: user.branchName ?? '',
    jobTitle: user.jobTitle ?? '',
    jobGrade: user.jobGrade ?? '',
    placeOfDuty: user.placeOfDuty ?? '',
    accountNumber: user.accountNumber ?? '',
    managerEmployeeNo: user.managerEmployeeNo ?? '',
    leaveBalance: user.leaveBalance ?? 0,
    responsibleCenter: user.responsibleCenter ?? '',
    permissionDepartments: user.permissionDepartments ?? [],
    phoneNumber: user.phoneNumber,
    gender: user.gender,
    userCategory: 'staff',
    HOD: user.HOD,
    CEO: user.CEO,
    mustChangePassword: user.mustChangePassword,
  }
}
