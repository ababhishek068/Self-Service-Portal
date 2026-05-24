import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PortalFormCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function PortalFormCard({ title, children, className }: PortalFormCardProps) {
  return (
    <div className={cn('portal-form-card animate-page-in mx-auto max-w-2xl', className)}>
      <div className="portal-form-card-header relative px-4 py-3 text-center text-base font-semibold tracking-wide text-white">
        {title}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
