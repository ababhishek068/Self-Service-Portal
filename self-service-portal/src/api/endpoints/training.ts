import { cancelModuleRequest, createModuleRequest, deleteModuleRequest, listModuleRequests } from './requestEndpoint'
import type { TrainingNeedsForm } from '@/schemas/requestSchemas'

const config = { module: 'training' as const, entity: 'selfServiceTrainingRequests' }

export const listTrainingRequests = () => listModuleRequests(config)

export const createTrainingRequest = (payload: TrainingNeedsForm) =>
  createModuleRequest(config, {
    ...payload,
    submit: true,
    title: payload.trainingTitle,
    amount: payload.estimatedCost ?? 0,
  })

export const cancelTrainingRequest = (id: string) => cancelModuleRequest(config, id)
export const deleteTrainingRequest = (id: string) => deleteModuleRequest(config, id)
