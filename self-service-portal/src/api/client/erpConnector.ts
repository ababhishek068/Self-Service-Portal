import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { assertRealErpConfig, env } from '@/config/env'
import type { ODataError } from '@/types/erp.types'

/**
 * Legacy direct-Business-Central OData v4 client.
 *
 * Kept for backwards compatibility with code paths that talk straight to BC
 * (bypassing the Laravel ESS backend). Prefer `essClient.ts` for new code —
 * the Laravel layer already handles NTLM SOAP, CSRF, sessions, etc.
 */

export type ODataParams = Record<
  '$filter' | '$expand' | '$select' | '$top' | '$skip' | '$orderby' | string,
  string | number | boolean | null | undefined
>

interface TokenCache {
  accessToken: string
  expiresAt: number
}

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export interface NormalizedErpError {
  message: string
  status?: number
  code?: string
  raw?: unknown
}

let tokenCache: TokenCache | null = null

export const erpHttp = axios.create({
  baseURL: env.ERP_BASE_URL,
  timeout: 12000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const friendlyMessages: Record<number, string> = {
  400: 'The request was not accepted by ERP. Please review highlighted fields.',
  401: 'Your ERP session expired. Please sign in again.',
  403: 'You are not authorized to perform this ERP action.',
  404: 'The ERP record could not be found.',
  409: 'ERP rejected the request because a conflicting record already exists.',
  422: 'ERP validation failed. Please review the request data.',
  429: 'ERP is busy. Please retry shortly.',
  500: 'ERP is temporarily unavailable.',
}

export async function getAccessToken(forceRefresh = false) {
  assertRealErpConfig()

  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken
  }

  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: env.SCOPE,
  })

  const response = await axios.post<TokenResponse>(env.TOKEN_URL, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000,
  }

  return tokenCache.accessToken
}

erpHttp.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

erpHttp.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const config = error.config as RetryableConfig | undefined

    if (status === 401 && config && !config._retry) {
      config._retry = true
      tokenCache = null
      const token = await getAccessToken(true)
      config.headers.Authorization = `Bearer ${token}`
      return erpHttp.request(config)
    }

    return Promise.reject(normalizeErpError(error))
  },
)

export function normalizeErpError(error: unknown): NormalizedErpError {
  if (!axios.isAxiosError(error)) {
    return { message: error instanceof Error ? error.message : 'Unexpected ERP connector error', raw: error }
  }

  const status = error.response?.status
  const data = error.response?.data as { error?: ODataError } | undefined
  const erpError = data?.error
  const message =
    erpError?.message ??
    (status ? friendlyMessages[status] : undefined) ??
    error.message ??
    'ERP connector failed'

  return {
    message,
    status,
    code: erpError?.code,
    raw: error.response?.data ?? error,
  }
}

function requestConfig(params?: ODataParams): AxiosRequestConfig {
  return params ? { params } : {}
}

export async function erpGet<T>(url: string, params?: ODataParams) {
  const response = await erpHttp.get<T>(url, requestConfig(params))
  return response.data
}

export async function erpPost<TResponse, TBody = unknown>(url: string, body: TBody, params?: ODataParams) {
  const response = await erpHttp.post<TResponse>(url, body, requestConfig(params))
  return response.data
}

export async function erpPatch<TResponse, TBody = unknown>(url: string, body: TBody, params?: ODataParams) {
  const response = await erpHttp.patch<TResponse>(url, body, requestConfig(params))
  return response.data
}

export async function erpDelete<TResponse = void>(url: string, params?: ODataParams) {
  const response = await erpHttp.delete<TResponse>(url, requestConfig(params))
  return response.data
}

export function erpEntityPath(entity: string) {
  return env.ERP_COMPANY_ID ? `/companies(${env.ERP_COMPANY_ID})/${entity}` : `/${entity}`
}
