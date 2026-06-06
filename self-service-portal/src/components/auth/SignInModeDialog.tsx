import { Building2, Cloud, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInModeOptions, type SignInMode } from '@/config/signInModes'

const modeIcons: Record<SignInMode, LucideIcon> = {
  application: Building2,
  ad: Users,
  bc365: Cloud,
}

interface SignInModeDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (mode: SignInMode) => void
  disabled?: boolean
}

export function SignInModeDialog({ open, onClose, onSelect, disabled }: SignInModeDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-mode-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[var(--portal-navy)] to-[var(--portal-orange)] px-5 py-4 text-white">
          <div>
            <h2 id="sign-in-mode-title" className="text-lg font-semibold">
              Choose sign-in method
            </h2>
            <p className="mt-1 text-sm text-white/85">Select how you want to authenticate</p>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-white/90 transition-colors hover:bg-white/15"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="divide-y divide-slate-100 p-2">
          {signInModeOptions.map((option) => {
            const Icon = modeIcons[option.id]
            return (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onSelect(option.id)}
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-navy)]/10 text-[var(--portal-navy)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--portal-navy)]">{option.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{option.description}</p>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-slate-100 px-5 py-3">
          <Button type="button" variant="outline" className="w-full" onClick={onClose} disabled={disabled}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
