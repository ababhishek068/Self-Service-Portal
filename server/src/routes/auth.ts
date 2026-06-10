import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { upsertEmployeeProfile } from '@ssp/db'
import { getAuthProvider } from '../auth/index.js'
import { toAuthUser, userStore } from '../auth/local/index.js'
import { env } from '../config/env.js'
import { AppError } from '../errors.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js'
import { issueToken } from '../services/token.js'
import { canUserApprove } from '../utils/roles.js'
import type { AuthUser, StoredUser } from '../types.js'

const router = Router()

const loginSchema = z.object({
  staffNo: z.string().min(1, 'Staff No is required'),
  password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

const registerSchema = z.object({
  staffNo: z.string().trim().min(2, 'Staff No is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Use a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().trim().min(1, 'Department code is required'),
  departmentName: z.string().trim().min(1, 'Department name is required'),
  managerEmployeeNo: z.string().trim().min(1, 'Manager staff number is required'),
  phoneNumber: z.string().trim().min(1, 'Phone number is required'),
  gender: z.enum(['Male', 'Female'], { message: 'Gender is required' }),
})

async function withCapabilities(user: AuthUser): Promise<AuthUser> {
  if (env.AUTH_PROVIDER !== 'local') {
    return { ...user, canApprove: Boolean(user.HOD || user.CEO) }
  }
  const stored = await userStore.findByStaffNo(user.employeeNo)
  if (!stored) return { ...user, canApprove: Boolean(user.HOD || user.CEO) }
  const directReports = await userStore.listDirectReports(user.employeeNo)
  return { ...user, canApprove: canUserApprove(stored) || directReports.length > 0 }
}

function toStoredRegisteredUser(input: z.infer<typeof registerSchema>, passwordHash: string): StoredUser {
  const now = new Date().toISOString()
  return {
    employeeNo: input.staffNo,
    name: input.firstName,
    lastName: input.lastName,
    roles: ['staff'],
    email: input.email,
    department: input.department,
    departmentName: input.departmentName,
    branchCode: '',
    branchName: '',
    jobTitle: '',
    jobGrade: '',
    placeOfDuty: '',
    accountNumber: '',
    managerEmployeeNo: input.managerEmployeeNo,
    leaveBalance: 21,
    responsibleCenter: input.department ? `HO-${input.department}` : '',
    permissionDepartments: input.department ? [input.department] : [],
    phoneNumber: input.phoneNumber,
    gender: input.gender,
    passwordHash,
    status: 'Active',
    HOD: false,
    CEO: false,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  }
}

/** POST /api/auth/login → { token, user } */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 422)
    }

    const { staffNo, password } = parsed.data
    const user = await withCapabilities(await getAuthProvider().authenticate(staffNo, password))
    const token = issueToken(user)

    res.json({ token, user })
  }),
)

/** POST /api/auth/register → { token, user } */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    if (env.AUTH_PROVIDER !== 'local') {
      throw new AppError('Registration is available only for local portal accounts.', 400, 'REGISTER_DISABLED')
    }

    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 422)
    }

    const staffNo = parsed.data.staffNo
    const existing = await userStore.findByStaffNo(staffNo)
    if (existing) throw new AppError('A user with this Staff No already exists.', 409, 'USER_EXISTS')

    if (parsed.data.managerEmployeeNo && parsed.data.managerEmployeeNo === staffNo) {
      throw new AppError('An employee cannot be their own manager.', 422, 'INVALID_MANAGER')
    }

    const manager = await userStore.findByStaffNo(parsed.data.managerEmployeeNo)
    if (!manager) throw new AppError('Manager Staff No does not exist.', 422, 'MANAGER_NOT_FOUND')

    const passwordHash = await bcrypt.hash(parsed.data.password, env.BCRYPT_ROUNDS)
    const stored = await userStore.upsert(toStoredRegisteredUser(parsed.data, passwordHash))

    if (env.AUTH_PROVIDER === 'local') {
      const today = new Date().toISOString().slice(0, 10)
      await upsertEmployeeProfile({
        employeeNo: stored.employeeNo,
        sector: stored.departmentName,
        division: stored.departmentName,
        district: '',
        employmentType: 'Permanent',
        dateOfJoin: today,
        contractStartDate: today,
        employmentHistory: [
          {
            organisation: stored.departmentName,
            position: 'Staff',
            fromDate: today,
            toDate: 'Present',
            type: 'Internal',
          },
        ],
        nextOfKin: [],
        qualifications: [],
        assignedAssets: [],
      })
    }

    const user = await withCapabilities(toAuthUser(stored))
    const token = issueToken(user)

    res.status(201).json({ token, user })
  }),
)

/** GET /api/auth/me → { user } (requires Bearer token) */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const employeeNo = req.user!.sub

    // For the local provider we can re-hydrate fresh data from the store.
    // For BC, the token payload is the source of truth until that lookup lands.
    if (env.AUTH_PROVIDER === 'local') {
      const stored = await userStore.findByStaffNo(employeeNo)
      if (!stored) throw new AppError('User no longer exists', 401, 'USER_GONE')
      res.json({ user: await withCapabilities(toAuthUser(stored)) })
      return
    }

    res.json({
      user: {
        employeeNo,
        name: req.user!.name,
        displayName: req.user!.name,
        roles: [],
        email: '',
        department: '',
        departmentName: '',
        branchCode: '',
        branchName: '',
        jobTitle: '',
        jobGrade: '',
        placeOfDuty: '',
        accountNumber: '',
        managerEmployeeNo: '',
        leaveBalance: 0,
        responsibleCenter: '',
        permissionDepartments: [],
        phoneNumber: '',
        gender: '',
        userCategory: 'staff' as const,
        HOD: req.user!.HOD,
        CEO: req.user!.CEO,
        canApprove: Boolean(req.user!.HOD || req.user!.CEO),
        mustChangePassword: false,
      },
    })
  }),
)

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout is primarily a client concern (discard the
 * token). This endpoint exists for symmetry and future token-revocation.
 */
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ message: 'Logged out' })
})

/** POST /api/auth/change-password (requires Bearer token, local provider only) */
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (env.AUTH_PROVIDER !== 'local') {
      throw new AppError('Password changes are managed by Business Central.', 400, 'BC_MANAGED')
    }

    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 422)
    }

    const employeeNo = req.user!.sub
    const user = await userStore.findByStaffNo(employeeNo)
    if (!user) throw new AppError('User no longer exists', 401, 'USER_GONE')

    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!ok) throw new AppError('Current password is incorrect', 422, 'BAD_PASSWORD')

    const newHash = await bcrypt.hash(parsed.data.newPassword, env.BCRYPT_ROUNDS)
    await userStore.updatePassword(employeeNo, newHash)

    res.json({ message: 'Password updated' })
  }),
)

export default router
