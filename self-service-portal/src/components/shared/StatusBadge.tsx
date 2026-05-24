import { Badge } from '@/components/ui/badge'
import type { BadgeStatus } from '@/types/erp.types'

const variants: Record<string, 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'orange'> = {
  Approved: 'green',
  Pass: 'green',
  Posted: 'red',
  Synced: 'green',
  Rejected: 'red',
  Fail: 'red',
  Error: 'red',
  Cancelled: 'red',
  Draft: 'gray',
  'Pending Approval': 'blue',
  Pending: 'red',
  Open: 'blue',
  New: 'red',
}

export function StatusBadge({ status }: { status: BadgeStatus | string }) {
  return <Badge variant={variants[status] ?? 'gray'}>{status}</Badge>
}
