import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { PettyCashForm } from '@/types/forms.types'

const pettyCashConfig = { module: 'pettyCash', entity: 'selfServicePettyCashRequests' } as const

export const listPettyCashRequests = () => listModuleRequests(pettyCashConfig, { $orderby: 'createdAt desc' })

export const createPettyCashRequest = (payload: PettyCashForm) =>
  createModuleRequest(pettyCashConfig, {
    ...payload,
    title: payload.activity,
    amount: payload.amount,
  })
