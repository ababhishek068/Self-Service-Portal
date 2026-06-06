import { cancelModuleRequest, createModuleRequest, deleteModuleRequest, listModuleRequests } from './requestEndpoint'
import type { DocumentRequisitionForm } from '@/schemas/requestSchemas'

const config = { module: 'documentRequisition' as const, entity: 'selfServiceDocumentRequests' }

export const listDocumentRequisitions = () => listModuleRequests(config)

export const createDocumentRequisition = (payload: DocumentRequisitionForm) =>
  createModuleRequest(config, {
    ...payload,
    submit: true,
    title: payload.documentType,
    amount: 0,
  })

export const cancelDocumentRequisition = (id: string) => cancelModuleRequest(config, id)
export const deleteDocumentRequisition = (id: string) => deleteModuleRequest(config, id)
