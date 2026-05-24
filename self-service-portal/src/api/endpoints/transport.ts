import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { TransportRequestForm } from '@/types/forms.types'

const transportConfig = { module: 'transport', entity: 'selfServiceTransportRequests' } as const

export const listTransportRequests = () => listModuleRequests(transportConfig, { $orderby: 'createdAt desc' })

export const createTransportRequest = (payload: TransportRequestForm) =>
  createModuleRequest(transportConfig, {
    ...payload,
    title: `${payload.transportType} transport to ${payload.destination}`,
    amount: payload.passengers.length,
  })
