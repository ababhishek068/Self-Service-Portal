import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthShell, AuthSwitchLink } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, bootstrapped, login, submitting, error } = useAuth()
  const [staffNo, setStaffNo] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (bootstrapped && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [bootstrapped, isAuthenticated, navigate])

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (!staffNo.trim() || !password) {
      setLocalError('Staff number and password are required.')
      return
    }

    try {
      await login(staffNo.trim(), password)
    } catch {
      /* auth context displays the error */
    }
  }

  const displayError = localError ?? error

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
    <AuthShell title="Sign in" subtitle="Enter your staff number and password to continue.">
      <form className="space-y-4 p-5 sm:p-6" onSubmit={handleFormSubmit}>
        {displayError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {displayError}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="staffNo">Staff number</Label>
          <Input
            id="staffNo"
            autoComplete="username"
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

        <Button type="submit" variant="accent" className="h-11 w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <AuthSwitchLink prompt="Don't have an account?" linkText="Sign up" to="/register" />
      </form>
    </AuthShell>
  )
}
