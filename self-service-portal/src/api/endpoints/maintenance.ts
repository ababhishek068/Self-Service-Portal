import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { MaintenanceRequestForm, TransferOrderForm } from '@/schemas/requestSchemas'

const maintenanceConfig = { module: 'maintenance', entity: 'selfServiceMaintenanceRequests' } as const
const transferConfig = { module: 'transferOrder', entity: 'selfServiceTransferOrders' } as const

export const listMaintenanceRequests = () => listModuleRequests(maintenanceConfig, { $orderby: 'createdAt desc' })

export const listTransferOrders = () => listModuleRequests(transferConfig, { $orderby: 'createdAt desc' })

export const createMaintenanceRequest = (payload: MaintenanceRequestForm) =>
  createModuleRequest(maintenanceConfig, {
    ...payload,
    title: `${payload.priority} maintenance ${payload.faTagNumber}`,
    amount: 0,
  })

export const createTransferOrder = (payload: TransferOrderForm) =>
  createModuleRequest(transferConfig, {
    ...payload,
    title: `${payload.transferType} handover ${payload.assetTagNumber}`,
    amount: 0,
  })
