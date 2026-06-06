import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { PettyCashForm } from '@/schemas/requestSchemas'

const pettyCashConfig = { module: 'pettyCash', entity: 'selfServicePettyCashRequests' } as const

export const listPettyCashRequests = () => listModuleRequests(pettyCashConfig)

export const createPettyCashRequest = (payload: PettyCashForm) =>
  createModuleRequest(pettyCashConfig, {
    ...payload,
    title: payload.activity,
    amount: payload.amount,
  })
