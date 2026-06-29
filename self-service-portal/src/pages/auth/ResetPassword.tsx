import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { resetForgottenPassword } from '@/api/endpoints/auth'
import { AuthShell, AuthSwitchLink } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPassword() {
  const { staffNo: routeStaffNo = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const staffNo = routeStaffNo
  const sentMessage = (location.state as { message?: string } | null)?.message
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!resetToken.trim()) {
      setError('Reset token is required.')
      return
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Password and confirmation do not match.')
      return
    }

    setSubmitting(true)
    try {
      const message = await resetForgottenPassword({
        staffNo,
        resetToken: resetToken.trim(),
        password,
        passwordConfirmation,
      })
      navigate('/login', { replace: true, state: { passwordResetMessage: message } })
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not reset the password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle={`Enter the latest token sent for ${staffNo || 'your staff account'} and choose a new password.`}
    >
      <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
        {sentMessage ? (
          <div className="rounded border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {sentMessage}
          </div>
        ) : null}
        {error ? (
          <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="resetToken">Reset Token</Label>
          <Input
            id="resetToken"
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">New Password (at least 8 characters)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirmation">Confirm Password</Label>
          <Input
            id="passwordConfirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            disabled={submitting}
            required
          />
        </div>

        <Button type="submit" variant="accent" className="h-11 w-full rounded-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting password…
            </>
          ) : (
            'Reset Password'
          )}
        </Button>

        <AuthSwitchLink prompt="Need another token?" linkText="Send again" to="/forgot-password" />
      </form>
    </AuthShell>
  )
}
