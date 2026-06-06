import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getAuthProvider } from '../auth/index.js'
import { toAuthUser, userStore } from '../auth/local/index.js'
import { env } from '../config/env.js'
import { AppError } from '../errors.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js'
import { issueToken } from '../services/token.js'

const router = Router()

const loginSchema = z.object({
  staffNo: z.string().min(1, 'Staff No is required'),
  password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

/** POST /api/auth/login → { token, user } */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 422)
    }

    const { staffNo, password } = parsed.data
    const user = await getAuthProvider().authenticate(staffNo, password)
    const token = issueToken(user)

    res.json({ token, user })
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
      res.json({ user: toAuthUser(stored) })
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
