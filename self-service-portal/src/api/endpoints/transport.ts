import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { TransportRequestForm } from '@/schemas/requestSchemas'

const transportConfig = { module: 'transport', entity: 'selfServiceTransportRequests' } as const

export const listTransportRequests = () => listModuleRequests(transportConfig)

export const createTransportRequest = (payload: TransportRequestForm) =>
  createModuleRequest(transportConfig, {
    ...payload,
    title: `${payload.transportType} transport to ${payload.destination}`,
    amount: payload.passengers.length,
  })
