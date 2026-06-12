import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors.js'

function isPrismaConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err ? String(err.name) : ''
  const message = 'message' in err ? String(err.message) : ''
  return (
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientKnownRequestError' ||
    message.includes("Can't reach database server")
  )
}

/** Wraps async route handlers so thrown/rejected errors reach Express. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

/** Centralised JSON error responder. Keep it last in the middleware chain. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, code: err.code })
    return
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'Malformed JSON body' })
    return
  }

  if (isPrismaConnectionError(err)) {
    res.status(503).json({
      message:
        'Database is unavailable. Check DATABASE_URL in server/.env (and db/.env), or use BC365 sign-in via SelfServiceBackend on port 4000.',
      code: 'DATABASE_UNAVAILABLE',
    })
    return
  }

  console.error('[unhandled]', err)
  res.status(500).json({ message: 'Internal server error' })
}
