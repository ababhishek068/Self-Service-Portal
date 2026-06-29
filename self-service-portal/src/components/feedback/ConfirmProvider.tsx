import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Visual intent of the confirm button. */
  tone?: 'default' | 'danger'
}

type Resolver = (value: boolean) => void

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [leaving, setLeaving] = useState(false)
  const resolverRef = useRef<Resolver | null>(null)

  const close = useCallback((result: boolean) => {
    setLeaving(true)
    window.setTimeout(() => {
      resolverRef.current?.(result)
      resolverRef.current = null
      setOptions(null)
      setLeaving(false)
    }, 160)
  }, [])

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next)
    setLeaving(false)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (!options) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false)
      if (event.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [options, close])

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm])
  const danger = options?.tone === 'danger'
  const Icon = danger ? Trash2 : options?.title ? AlertTriangle : HelpCircle

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Dismiss dialog"
                onClick={() => close(false)}
                className={`absolute inset-0 bg-slate-900/45 backdrop-blur-sm ${leaving ? 'animate-overlay-out' : 'animate-overlay-in'}`}
              />
              <div
                role="alertdialog"
                aria-modal="true"
                className={`relative w-[min(94vw,26rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
                  leaving ? 'animate-dialog-out' : 'animate-dialog-in'
                }`}
              >
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${danger ? 'from-red-500 to-rose-600' : 'from-[var(--portal-navy)] to-[var(--portal-orange)]'}`}
                />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                        danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[var(--portal-navy)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      {options.title ? (
                        <h2 className="text-base font-semibold text-slate-900">{options.title}</h2>
                      ) : null}
                      <div className={`text-sm text-slate-600 ${options.title ? 'mt-1' : ''}`}>{options.message}</div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => close(false)}>
                      {options.cancelLabel ?? 'Cancel'}
                    </Button>
                    <Button
                      type="button"
                      variant={danger ? 'destructive' : 'default'}
                      className="rounded-full"
                      autoFocus
                      onClick={() => close(true)}
                    >
                      {options.confirmLabel ?? 'Confirm'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider')
  return context.confirm
}
