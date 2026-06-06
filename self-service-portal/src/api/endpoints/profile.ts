import { authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'
import type { EmployeeProfileDetails } from '@/data/employeeProfile'

export async function getEmployeeProfileDetails(): Promise<EmployeeProfileDetails> {
  requireAuthApiUrl()
  return authGet<EmployeeProfileDetails>('/api/profile/details')
}
