import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { env } from '@/config/env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { isAuthenticated, login, submitting, error } = useAuth()
  const [employeeNo, setEmployeeNo] = useState(env.USE_MOCK ? 'HB-02418' : '')
  const [password, setPassword] = useState(env.USE_MOCK ? 'demo' : '')

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await login(employeeNo, password)
    } catch {
      // The auth context already stored the error; nothing else to do here.
    }
  }

  return (
    <main className="portal-login-bg portal-safe-pt portal-safe-pb portal-safe-px relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-6 sm:p-4">
      <div className="portal-ambient pointer-events-none absolute inset-0" aria-hidden>
        <span className="portal-orb portal-orb-navy opacity-50" />
        <span className="portal-orb portal-orb-orange opacity-40" />
      </div>
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="animate-page-in mb-6 text-center sm:mb-8">
          <div className="portal-logo-float mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 via-[var(--portal-navy)] to-[var(--portal-orange)] text-xl font-bold text-white shadow-xl ring-4 ring-white/60 sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl">
            H
          </div>
          <h1 className="portal-page-title text-xl font-bold sm:text-2xl">HIJRA BANK</h1>
          <p className="mt-1.5 text-base font-semibold tracking-wide text-[var(--portal-navy)] sm:mt-2 sm:text-lg">
            SELF SERVICE PORTAL
          </p>
        </div>

        <div className="portal-form-card animate-page-in w-full" style={{ animationDelay: '80ms' }}>
          <div className="portal-form-card-header relative px-4 py-3 text-center text-sm font-semibold text-white sm:text-base">
            Sign In
          </div>
          <div className="p-4 sm:p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="employeeNo">Staff No.</Label>
                <Input
                  id="employeeNo"
                  autoComplete="username"
                  inputMode="text"
                  value={employeeNo}
                  onChange={(event) => setEmployeeNo(event.target.value)}
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
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-500 sm:mt-6 sm:text-xs">
          © {new Date().getFullYear()} Hijra Bank. All rights reserved.
        </p>
      </div>
    </main>
  )
}
