import { authDelete, authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface WorkTicketRow {
  id: string
  ticketNo: string
  previousTicketNo: string
  gkNo: string
  type: string
  department: string
  status: string
}

export interface WorkTicketLine {
  id: string
  lineNo: string
  driverName: string
  departureFrom: string
  destination: string
  workDate: string
  authorizingOfficerName: string
}

export interface WorkTicketDetail extends WorkTicketRow {
  lines: WorkTicketLine[]
}

export async function listWorkTickets(): Promise<WorkTicketRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: WorkTicketRow[] }>('/api/work-tickets')
  return rows
}

export async function getWorkTicket(ticketNo: string) {
  requireAuthApiUrl()
  return authGet<WorkTicketDetail>(`/api/work-tickets/${encodeURIComponent(ticketNo)}`)
}

export async function deleteWorkTicketLine(ticketNo: string, lineNo: string) {
  requireAuthApiUrl()
  return authDelete<void>(
    `/api/work-tickets/${encodeURIComponent(ticketNo)}/lines/${encodeURIComponent(lineNo)}`,
  )
}
