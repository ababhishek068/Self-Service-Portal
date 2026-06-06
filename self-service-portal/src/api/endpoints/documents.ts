import { authGet, authHttp } from '@/api/client/authClient'
import { env } from '@/config/env'

export interface PolicyDocument {
  id: string
  title: string
  category: string
  updated: string
  fileName: string
  mimeType: string
}

const fallbackDocuments: PolicyDocument[] = [
  { id: 'hr-policy-manual', title: 'HR Policy Manual', category: 'Policy', updated: '12 Mar 2026', fileName: 'hr-policy-manual.txt', mimeType: 'text/plain' },
  { id: 'code-of-conduct', title: 'Code of Conduct', category: 'Policy', updated: '04 Feb 2026', fileName: 'code-of-conduct.txt', mimeType: 'text/plain' },
  { id: 'leave-application-form', title: 'Leave Application Form', category: 'Form', updated: '20 Jan 2026', fileName: 'leave-application-form.txt', mimeType: 'text/plain' },
  { id: 'travel-claim-form', title: 'Travel Claim Form', category: 'Form', updated: '12 Jan 2026', fileName: 'travel-claim-form.txt', mimeType: 'text/plain' },
  { id: 'performance-appraisal-guidelines', title: 'Performance Appraisal Guidelines', category: 'Guideline', updated: '02 Jan 2026', fileName: 'performance-appraisal-guidelines.txt', mimeType: 'text/plain' },
]

export async function listPolicyDocuments(): Promise<PolicyDocument[]> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return fallbackDocuments
  const { rows } = await authGet<{ rows: PolicyDocument[] }>('/api/documents')
  return rows
}

export async function downloadPolicyDocument(doc: PolicyDocument): Promise<void> {
  const blob =
    env.USE_MOCK || !env.AUTH_API_URL
      ? new Blob([`${doc.title}\n\nOffline preview document.`], { type: doc.mimeType })
      : (await authHttp.get<Blob>(`/api/documents/${encodeURIComponent(doc.id)}/download`, { responseType: 'blob' })).data

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
