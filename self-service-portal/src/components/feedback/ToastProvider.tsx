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
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  title?: string
  description?: string
  tone?: ToastTone
  /** Auto-dismiss delay in ms. Set to 0 to require manual dismissal. */
  duration?: number
}

interface ToastItem extends Required<Omit<ToastOptions, 'description' | 'title'>> {
  id: number
  title?: string
  description?: string
  leaving: boolean
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number
  success: (description: string, title?: string) => number
  error: (description: string, title?: string) => number
  info: (description: string, title?: string) => number
  warning: (description: string, title?: string) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneConfig: Record<
  ToastTone,
  { icon: typeof CheckCircle2; accent: string; iconColor: string; ring: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: 'from-emerald-500 to-green-600',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  error: {
    icon: XCircle,
    accent: 'from-red-500 to-rose-600',
    iconColor: 'text-red-600',
    ring: 'ring-red-200',
  },
  info: {
    icon: Info,
    accent: 'from-sky-500 to-blue-600',
    iconColor: 'text-sky-600',
    ring: 'ring-sky-200',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'from-amber-400 to-orange-500',
    iconColor: 'text-amber-600',
    ring: 'ring-amber-200',
  },
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const config = toneConfig[item.tone]
  const Icon = config.icon
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative flex w-[min(92vw,22rem)] items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-3.5 pr-9 shadow-xl ring-1 backdrop-blur ${config.ring} ${
        item.leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${config.accent}`} />
      <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        {item.title ? <p className="text-sm font-semibold text-slate-900">{item.title}</p> : null}
        {item.description ? (
          <p className={`break-words text-slate-600 ${item.title ? 'mt-0.5 text-xs' : 'text-sm'}`}>
            {item.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
      {item.duration > 0 ? (
        <span
          className={`absolute bottom-0 left-0 h-0.5 origin-left bg-gradient-to-r ${config.accent} animate-toast-progress`}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      ) : null}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
      window.setTimeout(() => remove(id), 220)
    },
    [remove],
  )

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = (idRef.current += 1)
      const duration = options.duration ?? 4200
      const item: ToastItem = {
        id,
        tone: options.tone ?? 'info',
        duration,
        title: options.title,
        description: options.description,
        leaving: false,
      }
      setToasts((current) => [...current.slice(-3), item])
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  // Bridge for non-React code: window.dispatchEvent(new CustomEvent('portal:toast', { detail }))
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastOptions>).detail
      if (detail) toast(detail)
    }
    window.addEventListener('portal:toast', handler as EventListener)
    return () => window.removeEventListener('portal:toast', handler as EventListener)
  }, [toast])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (description, title) => toast({ description, title, tone: 'success' }),
      error: (description, title) => toast({ description, title, tone: 'error', duration: 6000 }),
      info: (description, title) => toast({ description, title, tone: 'info' }),
      warning: (description, title) => toast({ description, title, tone: 'warning' }),
    }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:items-end portal-safe-pt">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
