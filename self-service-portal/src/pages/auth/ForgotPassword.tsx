import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '@/api/endpoints/auth'
import { AuthShell, AuthSwitchLink } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [staffNo, setStaffNo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedStaffNo = staffNo.trim()
    if (!normalizedStaffNo) {
      setError('Staff No. is required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const message = await requestPasswordReset(normalizedStaffNo)
      navigate(`/reset-password/${encodeURIComponent(normalizedStaffNo)}`, {
        state: { message },
      })
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not send the reset token.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Forgot / Change Password"
      subtitle="Enter your Staff No. We will email a reset token to the address in your employee profile."
    >
      <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
        {error ? (
          <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="staffNo">Staff No.</Label>
          <Input
            id="staffNo"
            value={staffNo}
            onChange={(event) => setStaffNo(event.target.value)}
            autoComplete="username"
            autoFocus
            disabled={submitting}
            required
          />
        </div>

        <Button type="submit" variant="accent" className="h-11 w-full rounded-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending token…
            </>
          ) : (
            'Send Reset Token'
          )}
        </Button>

        <AuthSwitchLink prompt="Remembered your password?" linkText="Sign in" to="/login" />
      </form>
    </AuthShell>
  )
}
