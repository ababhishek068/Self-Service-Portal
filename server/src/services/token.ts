import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AuthUser, TokenPayload } from '../types.js'

export function issueToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.employeeNo,
    name: user.displayName,
    CEO: user.CEO,
    HOD: user.HOD,
  }
  // expiresIn comes from env as a plain string (e.g. "8h"); the typings want a
  // narrower literal, so assert through SignOptions.
  const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
  return jwt.sign(payload, env.JWT_SECRET, options)
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}
