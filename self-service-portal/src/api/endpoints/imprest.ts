import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { ImprestRequestForm, ImprestSurrenderForm } from '@/schemas/requestSchemas'

const imprestConfig = { module: 'imprest', entity: 'selfServiceImprestRequests' } as const
const surrenderConfig = { module: 'imprestSurrender', entity: 'selfServiceImprestSurrenders' } as const

export const listImprestRequests = () => listModuleRequests(imprestConfig)

export const createImprestRequest = (payload: ImprestRequestForm) =>
  createModuleRequest(imprestConfig, {
    ...payload,
    title: `Imprest for ${payload.placeOfDuty}`,
    amount: payload.lines.reduce((sum, line) => sum + line.amount, 0),
  })

export const createImprestSurrender = (payload: ImprestSurrenderForm) =>
  createModuleRequest(surrenderConfig, {
    ...payload,
    title: `Surrender ${payload.imprestNo}`,
    amount: payload.amountUsed,
  })
