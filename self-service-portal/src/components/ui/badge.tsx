import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-105',
  {
  variants: {
    variant: {
      default: 'bg-slate-600',
      green: 'bg-[var(--portal-green)]',
      red: 'bg-red-600',
      yellow: 'bg-amber-500 text-slate-900',
      gray: 'bg-slate-500',
      blue: 'bg-[var(--portal-blue-action)]',
      orange: 'bg-[var(--portal-orange)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
