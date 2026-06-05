import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors.js'
import { verifyToken } from '../services/token.js'
import type { TokenPayload } from '../types.js'

/** Express request augmented with the decoded JWT payload. */
export interface AuthedRequest extends Request {
  user?: TokenPayload
}

/**
 * Gate for protected routes. Expects an `Authorization: Bearer <token>` header,
 * verifies the JWT, and attaches the decoded payload to `req.user`.
 */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401, 'NO_TOKEN')
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    throw new AppError('Session expired or invalid. Please sign in again.', 401, 'BAD_TOKEN')
  }
}
