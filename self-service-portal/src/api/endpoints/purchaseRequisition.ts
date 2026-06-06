import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { PurchaseRequisitionForm } from '@/schemas/requestSchemas'

const purchaseConfig = { module: 'purchaseRequisition', entity: 'selfServicePurchaseRequisitions' } as const

export const listPurchaseRequisitions = () =>
  listModuleRequests(purchaseConfig)

export const createPurchaseRequisition = (payload: PurchaseRequisitionForm) =>
  createModuleRequest(purchaseConfig, {
    ...payload,
    title: `Purchase requisition ${payload.departmentCode}`,
    amount: payload.lines.reduce((sum, line) => sum + line.amount, 0),
  })
