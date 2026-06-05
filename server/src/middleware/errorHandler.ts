import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors.js'

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

  console.error('[unhandled]', err)
  res.status(500).json({ message: 'Internal server error' })
}
