import { authDelete, authGet, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { PortalModuleKey, PortalRequest } from '@/types/erp.types'

export interface EndpointConfig {
  module: PortalModuleKey
  entity: string
}

export async function listModuleRequests(config: EndpointConfig) {
  requireAuthApiUrl()
  return authGet<PortalRequest[]>('/api/requests', { params: { module: config.module } })
}

export async function getModuleRequest(_config: EndpointConfig, id: string) {
  requireAuthApiUrl()
  return authGet<PortalRequest>(`/api/requests/${encodeURIComponent(id)}`)
}

export async function createModuleRequest(config: EndpointConfig, payload: Record<string, unknown>) {
  requireAuthApiUrl()
  return authPost<PortalRequest>('/api/requests', { ...payload, module: config.module })
}

export async function cancelModuleRequest(_config: EndpointConfig, id: string) {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/cancel`, {})
}

export async function deleteModuleRequest(_config: EndpointConfig, id: string) {
  requireAuthApiUrl()
  return authDelete<void>(`/api/requests/${encodeURIComponent(id)}`)
}
