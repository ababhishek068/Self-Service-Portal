import { authGet } from '@/api/client/authClient'
import { env } from '@/config/env'

export interface WorkTicketRow {
  id: string
  ticketNo: string
  vehicle: string
  driver: string
  date: string
  status: string
}

export async function listWorkTickets(): Promise<WorkTicketRow[]> {
  if (env.USE_MOCK || !env.AUTH_API_URL) return []
  const { rows } = await authGet<{ rows: WorkTicketRow[] }>('/api/work-tickets')
  return rows
}
