/** Error carrying an HTTP status + optional machine-readable code. */
export class AppError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 400, code?: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

export class AuthError extends AppError {
  constructor(message = 'Staff No or password is incorrect', status = 401, code?: string) {
    super(message, status, code)
    this.name = 'AuthError'
  }
}
