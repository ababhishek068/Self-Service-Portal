import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { VehicleTransferForm } from '@/schemas/requestSchemas'

const vehicleTransferConfig = { module: 'vehicleTransfer', entity: 'selfServiceVehicleTransfers' } as const

export const listVehicleTransfers = () => listModuleRequests(vehicleTransferConfig)

export const createVehicleTransfer = (payload: VehicleTransferForm) =>
  createModuleRequest(vehicleTransferConfig, {
    ...payload,
    title: `Vehicle transfer ${payload.vehicleNo}`,
    amount: 0,
  })
