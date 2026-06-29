import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-navy)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:shadow-md',
  {
    variants: {
      variant: {
        default: 'portal-btn-shine bg-[var(--portal-navy)] text-white shadow-sm hover:-translate-y-px hover:bg-[var(--portal-navy-dark)] hover:shadow-md',
        accent: 'portal-btn-shine bg-[var(--portal-orange)] text-white shadow-md hover:-translate-y-px hover:bg-[var(--portal-orange-hover)] hover:shadow-lg',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'text-slate-700 hover:bg-slate-100',
        success: 'bg-[var(--portal-green)] text-white hover:opacity-90',
        action: 'bg-[var(--portal-blue-action)] text-white hover:opacity-90',
        gradient: 'portal-btn-gradient portal-btn-shine shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
