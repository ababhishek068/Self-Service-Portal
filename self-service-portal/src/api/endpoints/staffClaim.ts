import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { StaffClaimForm } from '@/schemas/requestSchemas'

const staffClaimConfig = { module: 'staffClaim', entity: 'selfServiceStaffClaims' } as const

export const listStaffClaims = () => listModuleRequests(staffClaimConfig)

export const createStaffClaim = (payload: StaffClaimForm) => {
  const netAmount =
    payload.claimType === 'Medical' ? payload.grossAmount * (payload.coveragePercent / 100) : payload.grossAmount

  return createModuleRequest(staffClaimConfig, {
    ...payload,
    title: payload.claimType,
    amount: netAmount,
    netAmount,
  })
}
