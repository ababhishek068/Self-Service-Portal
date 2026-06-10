import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthShell, AuthSwitchLink } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'

export function Register() {
  const navigate = useNavigate()
  const { isAuthenticated, bootstrapped, register, submitting, error } = useAuth()
  const [staffNo, setStaffNo] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('')
  const [department, setDepartment] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [managerEmployeeNo, setManagerEmployeeNo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (bootstrapped && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [bootstrapped, isAuthenticated, navigate])

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (
      !staffNo.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !gender ||
      !department.trim() ||
      !departmentName.trim() ||
      !managerEmployeeNo.trim() ||
      !password
    ) {
      setLocalError('Please complete all required fields.')
      return
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Password and confirmation do not match.')
      return
    }

    try {
      await register({
        staffNo: staffNo.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        gender: gender as 'Male' | 'Female',
        department: department.trim(),
        departmentName: departmentName.trim(),
        managerEmployeeNo: managerEmployeeNo.trim(),
        password,
      })
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
    <AuthShell
      size="lg"
      title="Create account"
      subtitle="Provide your employee details to register for the self-service portal."
      footer={
        <p className="mt-5 text-center text-xs text-slate-500">
          Your manager staff number must already exist in the system for approval routing.
        </p>
      }
    >
      <form className="space-y-6 p-5 sm:p-6" onSubmit={handleFormSubmit}>
        {displayError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {displayError}
          </div>
        ) : null}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-800">Personal details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={submitting}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={submitting}
                autoComplete="family-name"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                disabled={submitting}
                autoComplete="tel"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              placeholder="Select gender"
              disabled={submitting}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-800">Work details</legend>
          <div className="space-y-1.5">
            <Label htmlFor="staffNo">Staff number</Label>
            <Input
              id="staffNo"
              value={staffNo}
              onChange={(event) => setStaffNo(event.target.value)}
              disabled={submitting}
              autoComplete="username"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department code</Label>
              <Input
                id="department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={submitting}
                placeholder="e.g. FIN"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departmentName">Department name</Label>
              <Input
                id="departmentName"
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                disabled={submitting}
                placeholder="e.g. Finance"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="managerEmployeeNo">Manager staff number</Label>
            <Input
              id="managerEmployeeNo"
              value={managerEmployeeNo}
              onChange={(event) => setManagerEmployeeNo(event.target.value)}
              disabled={submitting}
              placeholder="e.g. EMP-01002"
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-800">Security</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>
        </fieldset>

        <Button type="submit" variant="accent" className="h-11 w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <AuthSwitchLink prompt="Already have an account?" linkText="Sign in" to="/login" />
      </form>
    </AuthShell>
  )
}
