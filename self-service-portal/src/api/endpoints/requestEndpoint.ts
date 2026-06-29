import { authDelete, authGet, authHttp, authPost } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { PortalModuleKey, PortalRequest } from '@/types/erp.types'

export interface EndpointConfig {
  module: PortalModuleKey
  entity: string
}

export async function listModuleRequests(config: EndpointConfig, params?: Record<string, string | undefined>) {
  requireAuthApiUrl()
  return authGet<PortalRequest[]>('/api/requests', { params: { module: config.module, ...params } })
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

export async function submitModuleRequest(_config: EndpointConfig, id: string) {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/submit`, {})
}

export async function deleteModuleRequest(_config: EndpointConfig, id: string) {
  requireAuthApiUrl()
  return authDelete<void>(`/api/requests/${encodeURIComponent(id)}`)
}

export async function updateRequestHeader(id: string, patch: Record<string, unknown>) {
  requireAuthApiUrl()
  return authHttp.patch<PortalRequest>(`/api/requests/${encodeURIComponent(id)}`, patch).then((r) => r.data)
}

export async function addRequestLine(id: string, line: Record<string, unknown>) {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/lines`, line)
}

export async function setRequestLines(id: string, lines: Record<string, unknown>[]) {
  requireAuthApiUrl()
  return authHttp.put<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/lines`, { lines }).then((r) => r.data)
}

export async function updateRequestLine(id: string, lineId: string, patch: Record<string, unknown>) {
  requireAuthApiUrl()
  return authHttp
    .patch<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`, patch)
    .then((r) => r.data)
}

export async function deleteRequestLine(id: string, lineId: string) {
  requireAuthApiUrl()
  return authDelete<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`)
}

export async function receiveStoreRequestLine(
  id: string,
  lineId: string,
  payload: { quantityToReceive: number; reason?: string },
) {
  requireAuthApiUrl()
  return authHttp
    .patch<PortalRequest>(
      `/api/requests/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}/receive`,
      payload,
    )
    .then((r) => r.data)
}

export async function postStoreRequestReceipt(id: string) {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/post-receipt`, {})
}

export async function uploadRequestAttachment(id: string, attachment: Record<string, unknown>) {
  requireAuthApiUrl()
  return authPost<PortalRequest>(`/api/requests/${encodeURIComponent(id)}/attachments`, attachment)
}

export async function deleteRequestAttachment(id: string, attachmentId: string) {
  requireAuthApiUrl()
  return authDelete<PortalRequest>(
    `/api/requests/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
  )
}

export async function downloadRequestAttachment(
  requestId: string,
  attachment: { id: string; fileName: string; fileType: string },
) {
  requireAuthApiUrl()
  const response = await authHttp.get<Blob>(
    `/api/requests/${encodeURIComponent(requestId)}/attachments/${encodeURIComponent(attachment.id)}/download`,
    {
      params: { fileName: attachment.fileName, fileType: attachment.fileType },
      responseType: 'blob',
    },
  )
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
