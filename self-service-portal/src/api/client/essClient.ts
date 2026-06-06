import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'

/**
 * HTTP client for the Laravel ESS backend.
 *
 * The Laravel app uses session cookies for auth (see
 * `App\Http\Controllers\Auth\AuthenticatedSessionController`). In addition,
 * mutating routes are guarded by Laravel's CSRF middleware, so we fetch a
 * token from `/api/csrf-token` once per session and forward it on every
 * non-GET request as both the `X-XSRF-TOKEN` and `X-CSRF-TOKEN` headers
 * (Laravel accepts either). Cookies are sent with `withCredentials: true`.
 */

let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null

export const essHttp: AxiosInstance = axios.create({
  baseURL: env.ESS_API_URL || '',
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  if (csrfPromise) return csrfPromise
  csrfPromise = essHttp
    .get<{ token: string }>('/api/csrf-token')
    .then((res) => {
      csrfToken = res.data.token
      return csrfToken
    })
    .finally(() => {
      csrfPromise = null
    })
  return csrfPromise
}

essHttp.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = await fetchCsrfToken()
    config.headers.set?.('X-CSRF-TOKEN', token)
    config.headers.set?.('X-XSRF-TOKEN', token)
  }
  return config
})

export interface NormalizedEssError {
  message: string
  status?: number
  code?: string
  raw?: unknown
}

export class EssApiError extends Error implements NormalizedEssError {
  status?: number
  code?: string
  raw?: unknown
  constructor({ message, status, code, raw }: NormalizedEssError) {
    super(message)
    this.name = 'EssApiError'
    this.status = status
    this.code = code
    this.raw = raw
  }
}

essHttp.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as { message?: string; code?: string } | undefined
    if (status === 419) {
      // CSRF token mismatch — invalidate and let the caller retry.
      csrfToken = null
    }
    const normalized: NormalizedEssError = {
      message: data?.message ?? error.message ?? 'Request failed',
      status,
      code: data?.code,
      raw: error.response?.data ?? error,
    }
    return Promise.reject(new EssApiError(normalized))
  },
)

/* ---------- Convenience wrappers ---------- */

export async function essGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await essHttp.get<T>(url, config)
  return response.data
}

export async function essPost<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const response = await essHttp.post<T>(url, body, config)
  return response.data
}

export function clearEssSession() {
  csrfToken = null
}
