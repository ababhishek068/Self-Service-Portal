import { cancelModuleRequest, createModuleRequest, deleteModuleRequest, listModuleRequests } from './requestEndpoint'
import type { SalaryAdvanceForm } from '@/schemas/requestSchemas'

const config = { module: 'salaryAdvance' as const, entity: 'selfServiceSalaryAdvanceRequests' }

export const listSalaryAdvanceRequests = () => listModuleRequests(config)

export const createSalaryAdvanceRequest = (payload: SalaryAdvanceForm) =>
  createModuleRequest(config, {
    ...payload,
    title: `Salary advance - ${payload.purpose.slice(0, 40)}`,
    amount: 0,
  })

export const cancelSalaryAdvanceRequest = (id: string) => cancelModuleRequest(config, id)
export const deleteSalaryAdvanceRequest = (id: string) => deleteModuleRequest(config, id)
