import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { FuelRequestForm } from '@/schemas/requestSchemas'

const fuelConfig = { module: 'fuelRequest', entity: 'selfServiceFuelRequests' } as const

export const listFuelRequests = () => listModuleRequests(fuelConfig, { $orderby: 'createdAt desc' })

export const createFuelRequest = (payload: FuelRequestForm) =>
  createModuleRequest(fuelConfig, {
    ...payload,
    title: `Fuel request ${payload.vehicleNo}`,
    amount: payload.liters,
  })
