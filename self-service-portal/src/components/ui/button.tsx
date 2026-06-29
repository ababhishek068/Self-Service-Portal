import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariantProps } from './buttonVariants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
  /** Disable the tap ripple feedback (enabled by default for native buttons). */
  noRipple?: boolean
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, noRipple = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!asChild && !noRipple && !prefersReducedMotion()) {
        const target = event.currentTarget
        const rect = target.getBoundingClientRect()
        const rippleSize = Math.max(rect.width, rect.height)
        const ripple = document.createElement('span')
        ripple.className = 'portal-ripple'
        ripple.style.width = ripple.style.height = `${rippleSize}px`
        ripple.style.left = `${event.clientX - rect.left - rippleSize / 2}px`
        ripple.style.top = `${event.clientY - rect.top - rippleSize / 2}px`
        target.appendChild(ripple)
        window.setTimeout(() => ripple.remove(), 600)
      }
      onClick?.(event)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), !asChild && 'relative overflow-hidden')}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
