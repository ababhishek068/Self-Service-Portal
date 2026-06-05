import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'

/**
 * HTTP client for "our backend" (Node/Express) — way #2 login.
 *
 * Auth is stateless JWT: on login we store a bearer token and attach it to
 * every request via the Authorization header. No cookies/CSRF needed, which is
 * why this is a separate client from `essClient` (Laravel session-based).
 */

const TOKEN_KEY = 'ssp.authToken'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export const authHttp: AxiosInstance = axios.create({
  baseURL: env.AUTH_API_URL || '',
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

authHttp.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`)
  }
  return config
})

export interface NormalizedAuthError {
  message: string
  status?: number
  code?: string
}

export class AuthApiError extends Error implements NormalizedAuthError {
  status?: number
  code?: string
  constructor({ message, status, code }: NormalizedAuthError) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

authHttp.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as { message?: string; code?: string } | undefined
    // A rejected/expired token should not linger.
    if (status === 401) clearToken()
    return Promise.reject(
      new AuthApiError({
        message: data?.message ?? error.message ?? 'Request failed',
        status,
        code: data?.code,
      }),
    )
  },
)

export async function authGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await authHttp.get<T>(url, config)
  return response.data
}

export async function authPost<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const response = await authHttp.post<T>(url, body, config)
  return response.data
}
