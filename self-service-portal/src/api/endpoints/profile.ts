import { authGet } from '@/api/client/authClient'
import { env } from '@/config/env'
import { defaultProfileDetails, type EmployeeProfileDetails } from '@/data/employeeProfile'

export async function getEmployeeProfileDetails(): Promise<EmployeeProfileDetails> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return defaultProfileDetails
  return authGet<EmployeeProfileDetails>('/api/profile/details')
}
