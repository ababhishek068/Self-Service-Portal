import { env } from '@/config/env'
import { authDelete, authGet, authPost } from '@/api/client/authClient'
import { erpEntityPath, erpGet, erpPost, type ODataParams } from '@/api/client/erpConnector'
import { mockCancelRequest, mockCreateRequest, mockDeleteRequest, mockGetRequest, mockListRequests } from '@/api/mock/mockStore'
import type { PortalModuleKey, PortalRequest, ODataCollection } from '@/types/erp.types'

export interface EndpointConfig {
  module: PortalModuleKey
  entity: string
}

export async function listModuleRequests(config: EndpointConfig, params?: ODataParams) {
  if (env.USE_MOCK) return mockListRequests(config.module)
  if (env.AUTH_API_URL) {
    return authGet<PortalRequest[]>('/api/requests', { params: { module: config.module } })
  }
  const result = await erpGet<ODataCollection<PortalRequest>>(erpEntityPath(config.entity), params)
  return result.value
}

export async function getModuleRequest(config: EndpointConfig, id: string) {
  if (env.USE_MOCK) return mockGetRequest(id)
  if (env.AUTH_API_URL) return authGet<PortalRequest>(`/api/requests/${encodeURIComponent(id)}`)
  return erpGet<PortalRequest>(`${erpEntityPath(config.entity)}(${id})`)
}

export async function createModuleRequest(config: EndpointConfig, payload: Record<string, unknown>) {
  if (env.USE_MOCK) return mockCreateRequest(config.module, payload)
  if (env.AUTH_API_URL) {
    return authPost<PortalRequest>('/api/requests', { ...payload, module: config.module })
  }
  return erpPost<PortalRequest>(erpEntityPath(config.entity), payload)
}

export async function cancelModuleRequest(config: EndpointConfig, id: string) {
  if (env.USE_MOCK) return mockCancelRequest(id)
  if (env.AUTH_API_URL) return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/cancel`, {})
  return erpPost<PortalRequest>(`${erpEntityPath(config.entity)}(${id})/cancel`, {})
}

export async function deleteModuleRequest(config: EndpointConfig, id: string) {
  if (env.USE_MOCK) return mockDeleteRequest(id)
  if (env.AUTH_API_URL) return authDelete<void>(`/api/requests/${encodeURIComponent(id)}`)
  return erpPost<void>(`${erpEntityPath(config.entity)}(${id})/delete`, {})
}
