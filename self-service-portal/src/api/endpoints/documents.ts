import { authGet, authHttp } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface PolicyDocument {
  id: string
  title: string
  category: string
  updated: string
  fileName: string
  mimeType: string
}

export async function listPolicyDocuments(): Promise<PolicyDocument[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: PolicyDocument[] }>('/api/documents')
  return rows
}

export async function downloadPolicyDocument(doc: PolicyDocument): Promise<void> {
  requireAuthApiUrl()
  const blob = (
    await authHttp.get<Blob>(`/api/documents/${encodeURIComponent(doc.id)}/download`, { responseType: 'blob' })
  ).data

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
