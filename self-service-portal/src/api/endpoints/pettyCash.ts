import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { PettyCashForm, PettyCashReplenishmentForm } from '@/schemas/requestSchemas'

const pettyCashConfig = { module: 'pettyCash', entity: 'selfServicePettyCashRequests' } as const
const replenishmentConfig = {
  module: 'pettyCashReplenishment',
  entity: 'selfServicePettyCashReplenishments',
} as const

export const listPettyCashRequests = () => listModuleRequests(pettyCashConfig)

export const createPettyCashRequest = (payload: PettyCashForm) =>
  createModuleRequest(pettyCashConfig, {
    ...payload,
    title: payload.activity,
    amount: payload.amount,
  })

export const listPettyCashReplenishments = () => listModuleRequests(replenishmentConfig)

export const createPettyCashReplenishment = (payload: PettyCashReplenishmentForm) =>
  createModuleRequest(replenishmentConfig, {
    ...payload,
    title: `Petty cash replenishment - ${payload.remarks.slice(0, 40)}`,
    amount: payload.sourceAmount,
  })
