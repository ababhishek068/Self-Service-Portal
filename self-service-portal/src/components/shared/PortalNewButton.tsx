import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PortalNewButtonProps {
  label: string
  onClick?: () => void
  className?: string
}

export function PortalNewButton({ label, onClick, className }: PortalNewButtonProps) {
  return (
    <Button type="button" variant="accent" className={cn('rounded-full px-5', className)} onClick={onClick}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  )
}
