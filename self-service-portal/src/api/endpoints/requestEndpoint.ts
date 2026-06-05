import { env } from '@/config/env'
import { erpEntityPath, erpGet, erpPost, type ODataParams } from '@/api/client/erpConnector'
import { mockCreateRequest, mockGetRequest, mockListRequests } from '@/api/mock/mockStore'
import type { PortalModuleKey, PortalRequest, ODataCollection } from '@/types/erp.types'

export interface EndpointConfig {
  module: PortalModuleKey
  entity: string
}

export async function listModuleRequests(config: EndpointConfig, params?: ODataParams) {
  if (env.USE_MOCK) return mockListRequests(config.module)
  const result = await erpGet<ODataCollection<PortalRequest>>(erpEntityPath(config.entity), params)
  return result.value
}

export async function getModuleRequest(config: EndpointConfig, id: string) {
  if (env.USE_MOCK) return mockGetRequest(id)
  return erpGet<PortalRequest>(`${erpEntityPath(config.entity)}(${id})`)
}

export async function createModuleRequest(config: EndpointConfig, payload: Record<string, unknown>) {
  if (env.USE_MOCK) return mockCreateRequest(config.module, payload)
  return erpPost<PortalRequest>(erpEntityPath(config.entity), payload)
}
