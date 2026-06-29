import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { MaintenanceRequestForm, TransferOrderForm } from '@/schemas/requestSchemas'

const maintenanceConfig = { module: 'maintenance', entity: 'selfServiceMaintenanceRequests' } as const
const transferConfig = { module: 'transferOrder', entity: 'selfServiceTransferOrders' } as const

export const listMaintenanceRequests = () => listModuleRequests(maintenanceConfig)

export const listTransferOrders = () => listModuleRequests(transferConfig)

export const createMaintenanceRequest = (payload: MaintenanceRequestForm) =>
  createModuleRequest(maintenanceConfig, {
    ...payload,
    vehicleNo: payload.requestType === '2' ? payload.vehicleNo : payload.faTagNumber,
    purpose: [
      payload.issueDescription,
      `Item: ${payload.item}`,
      `Priority: ${payload.priority}`,
      `Location: ${payload.location}`,
      payload.requestType === '2' ? `Odometer: ${payload.odometer} km` : '',
    ].filter(Boolean).join(' | '),
    title: `${payload.priority} maintenance ${payload.vehicleNo || payload.faTagNumber || payload.item}`,
    amount: 0,
  })

export const createTransferOrder = (payload: TransferOrderForm) =>
  createModuleRequest(transferConfig, {
    ...payload,
    title: `Transfer order ${payload.from} to ${payload.to}`,
    amount: 0,
  })
