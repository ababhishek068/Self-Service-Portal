import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SignInModeDialog } from '@/components/auth/SignInModeDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInModeOptions, type SignInMode } from '@/config/signInModes'
import { useAuth } from '@/hooks/useAuth'
import { brand } from '@/config/brand'

const SIGN_IN_MODE_KEY = 'ssp.signInMode'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, bootstrapped, login, submitting, error } = useAuth()
  const [staffNo, setStaffNo] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<SignInMode>(() => {
    try {
      const stored = sessionStorage.getItem(SIGN_IN_MODE_KEY) as SignInMode | null
      return stored && signInModeOptions.some((option) => option.id === stored) ? stored : 'application'
    } catch {
      return 'application'
    }
  })

  useEffect(() => {
    if (bootstrapped && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [bootstrapped, isAuthenticated, navigate])

  useEffect(() => {
    if (!dialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) setDialogOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [dialogOpen, submitting])

  const runSignIn = async (mode: SignInMode) => {
    setSelectedMode(mode)
    try {
      sessionStorage.setItem(SIGN_IN_MODE_KEY, mode)
    } catch {
      /* ignore */
    }
    setDialogOpen(false)
    setLocalError(null)

    if (mode === 'ad') {
      setLocalError('Active Directory sign-in is not configured yet. Choose Application User or BC365 User.')
      return
    }

    try {
      await login(staffNo.trim(), password, mode === 'bc365' ? 'bc365' : 'application')
    } catch {
      /* auth context displays the error */
    }
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (!staffNo.trim() || !password) {
      setLocalError('Staff number and password are required.')
      return
    }

    setDialogOpen(true)
  }

  const displayError = localError ?? error
  const passwordResetMessage =
    (location.state as { passwordResetMessage?: string } | null)?.passwordResetMessage
  const selectedLabel =
    signInModeOptions.find((option) => option.id === selectedMode)?.label ?? signInModeOptions[0].label

  if (!bootstrapped || isAuthenticated) {
    return (
      <main className="portal-login-bg portal-safe-pt portal-safe-pb flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {bootstrapped ? 'Redirecting…' : 'Restoring your session…'}
        </div>
      </main>
    )
  }

  return (
    <main className="portal-login-bg portal-safe-pt portal-safe-pb portal-safe-px relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 sm:p-4">
      <div className="portal-ambient pointer-events-none absolute inset-0" aria-hidden>
        <span className="portal-orb portal-orb-navy opacity-50" />
        <span className="portal-orb portal-orb-orange opacity-40" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="animate-page-in-subtle mb-6 text-center sm:mb-8">
          <div className="portal-logo-float mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 via-[var(--portal-navy)] to-[var(--portal-orange)] text-xl font-bold text-white shadow-xl ring-4 ring-white/60 sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl">
            {brand.monogram}
          </div>
          <h1 className="portal-page-title text-xl font-bold uppercase sm:text-2xl">{brand.company}</h1>
          <p className="mt-1.5 text-base font-semibold tracking-wide text-[var(--portal-navy)] sm:mt-2 sm:text-lg">
            {brand.product.toUpperCase()}
          </p>
        </div>

        <div className="portal-form-card animate-page-in-subtle w-full" style={{ animationDelay: '80ms' }}>
          <div className="portal-form-card-header relative px-4 py-3 text-center text-sm font-semibold tracking-wide text-white sm:text-base">
            Sign In
          </div>

          <form className="space-y-4 p-4 sm:p-6" onSubmit={handleFormSubmit}>
            {passwordResetMessage ? (
              <div className="rounded border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                {passwordResetMessage}
              </div>
            ) : null}
            {displayError ? (
              <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {displayError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="staffNo">Staff No.</Label>
              <Input
                id="staffNo"
                autoComplete="username"
                inputMode="text"
                value={staffNo}
                onChange={(event) => setStaffNo(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              className="h-11 w-full rounded-full text-sm sm:text-base"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            {selectedMode !== 'application' ? (
              <p className="text-center text-[11px] text-slate-500">Last selected: {selectedLabel}</p>
            ) : null}

            <p className="text-center text-sm text-slate-600">
              <Link to="/forgot-password" className="font-semibold text-[var(--portal-navy)] hover:underline">
                Forgot or change your password?
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-500 sm:mt-6 sm:text-xs">
          © {new Date().getFullYear()} {brand.company}. All rights reserved.
        </p>
      </div>

      <SignInModeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(mode) => void runSignIn(mode)}
        disabled={submitting}
      />
    </main>
  )
}
