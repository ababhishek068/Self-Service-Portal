import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { GatePassForm } from '@/schemas/requestSchemas'

const gatePassConfig = { module: 'gatePass', entity: 'selfServiceGatePasses' } as const

export type GatePassSource = 'storeIssue' | 'transferOrder' | 'assetTransfer'

export const gatePassSources: Array<{
  value: GatePassSource
  label: string
  singularLabel: string
  description: string
}> = [
  {
    value: 'storeIssue',
    label: 'Store Requisitions',
    singularLabel: 'Store Requisition',
    description: 'Gate passes generated from Store Issue documents.',
  },
  {
    value: 'transferOrder',
    label: 'Transfer Orders',
    singularLabel: 'Transfer Order',
    description: 'Gate passes generated from posted Transfer Orders.',
  },
  {
    value: 'assetTransfer',
    label: 'Asset Transfers',
    singularLabel: 'Asset Transfer',
    description: 'Gate passes generated from Asset Transfer documents.',
  },
]

export const listGatePasses = (source: GatePassSource = 'storeIssue') =>
  listModuleRequests(gatePassConfig, { source })

export const createGatePass = (payload: GatePassForm) =>
  createModuleRequest(gatePassConfig, {
    ...payload,
    title: `${payload.gatePassType} gate pass`,
    amount: 0,
  })
