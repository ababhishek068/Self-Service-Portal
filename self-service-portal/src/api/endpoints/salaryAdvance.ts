import { cancelModuleRequest, createModuleRequest, deleteModuleRequest, listModuleRequests } from './requestEndpoint'
import type { SalaryAdvanceForm } from '@/schemas/requestSchemas'

const config = { module: 'salaryAdvance' as const, entity: 'selfServiceSalaryAdvanceRequests' }

export const listSalaryAdvanceRequests = () => listModuleRequests(config, { $orderby: 'createdAt desc' })

export const createSalaryAdvanceRequest = (payload: SalaryAdvanceForm) =>
  createModuleRequest(config, {
    ...payload,
    submit: true,
    title: `Salary advance — ${payload.reason.slice(0, 40)}`,
    amount: payload.amount,
  })

export const cancelSalaryAdvanceRequest = (id: string) => cancelModuleRequest(config, id)
export const deleteSalaryAdvanceRequest = (id: string) => deleteModuleRequest(config, id)
