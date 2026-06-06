import { authGet } from '@/api/client/authClient'
import { requireAuthApiUrl } from '@/api/requireBackend'

export interface WorkTicketRow {
  id: string
  ticketNo: string
  vehicle: string
  driver: string
  date: string
  status: string
}

export async function listWorkTickets(): Promise<WorkTicketRow[]> {
  requireAuthApiUrl()
  const { rows } = await authGet<{ rows: WorkTicketRow[] }>('/api/work-tickets')
  return rows
}
