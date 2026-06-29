import { authGet, authHttp } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { EmployeeProfileDetails } from '@/data/employeeProfile'
import type { Attachment } from '@/types/erp.types'

export async function getEmployeeProfileDetails(): Promise<EmployeeProfileDetails> {
  requireAuthApiUrl()
  return authGet<EmployeeProfileDetails>('/api/profile/details')
}

export async function listEmployeeAttachments(): Promise<Attachment[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: Attachment[] }>('/api/profile/attachments')
  return rows
}

export async function downloadEmployeeAttachment(attachment: Attachment): Promise<void> {
  requireAuthApiUrl()
  const response = await authHttp.get<Blob>(
    `/api/profile/attachments/${encodeURIComponent(attachment.id)}/download`,
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
