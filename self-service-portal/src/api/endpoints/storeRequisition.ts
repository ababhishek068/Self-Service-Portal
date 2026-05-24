import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { StoreRequisitionForm } from '@/types/forms.types'

const storeConfig = { module: 'storeRequisition', entity: 'selfServiceStoreRequisitions' } as const

export const listStoreRequisitions = () => listModuleRequests(storeConfig, { $expand: 'lines', $orderby: 'createdAt desc' })

export const createStoreRequisition = (payload: StoreRequisitionForm) =>
  createModuleRequest(storeConfig, {
    ...payload,
    title: `Store requisition ${payload.departmentCode}`,
    amount: payload.lines.reduce((sum, line) => sum + line.quantity, 0),
  })
