import { differenceInCalendarDays, parseISO } from 'date-fns'
import { createModuleRequest, listModuleRequests } from './requestEndpoint'
import type { LeaveRequestForm } from '@/types/forms.types'

const leaveConfig = { module: 'leave', entity: 'selfServiceLeaveRequests' } as const

export const listLeaveRequests = () => listModuleRequests(leaveConfig, { $orderby: 'createdAt desc' })

export const createLeaveRequest = (payload: LeaveRequestForm) => {
  const days = differenceInCalendarDays(parseISO(payload.endDate), parseISO(payload.startDate)) + 1
  return createModuleRequest(leaveConfig, {
    ...payload,
    title: `${payload.leaveType} leave`,
    amount: days,
    days,
  })
}
