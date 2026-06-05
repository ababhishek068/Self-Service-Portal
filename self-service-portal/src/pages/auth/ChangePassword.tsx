import { useState } from 'react'
import { changePasswordRequest } from '@/api/endpoints/auth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }

    setSubmitting(true)
    try {
      await changePasswordRequest(current, next)
      setSuccess('Your password has been updated.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper title="Change Password" showPageHeading={false}>
      <PortalFormCard title="Change Password">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded border-l-4 border-green-500 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="current">Current Password:</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New Password:</Label>
            <Input
              id="new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password:</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit" className="min-w-[100px] rounded-full" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update'}
            </Button>
          </div>
        </form>
      </PortalFormCard>
    </PageWrapper>
  )
}
