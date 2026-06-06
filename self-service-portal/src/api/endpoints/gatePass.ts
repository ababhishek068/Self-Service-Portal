import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { GatePassForm } from '@/schemas/requestSchemas'

const gatePassConfig = { module: 'gatePass', entity: 'selfServiceGatePasses' } as const

export const listGatePasses = () => listModuleRequests(gatePassConfig)

export const createGatePass = (payload: GatePassForm) =>
  createModuleRequest(gatePassConfig, {
    ...payload,
    title: `${payload.gatePassType} gate pass`,
    amount: 0,
  })
