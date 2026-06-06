import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { OvertimeRequestForm, TravelRequestForm } from '@/schemas/requestSchemas'

const overtimeConfig = { module: 'overtime', entity: 'selfServiceOvertimeRequests' } as const
const travelConfig = { module: 'travel', entity: 'selfServiceTravelRequests' } as const

export const listOvertimeRequests = () => listModuleRequests(overtimeConfig)

export const createOvertimeRequest = (payload: OvertimeRequestForm) =>
  createModuleRequest(overtimeConfig, {
    ...payload,
    title: `Overtime ${payload.workDate}`,
    amount: payload.hours,
  })

export const listTravelRequests = () => listModuleRequests(travelConfig)

export const createTravelRequest = (payload: TravelRequestForm) =>
  createModuleRequest(travelConfig, {
    ...payload,
    title: `Travel to ${payload.destination}`,
    amount: payload.estimatedExpense,
  })
