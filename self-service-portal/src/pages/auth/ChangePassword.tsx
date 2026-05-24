import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePassword() {
  return (
    <PageWrapper title="Change Password" showPageHeading={false}>
      <PortalFormCard title="Change Password">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="current">Current Password:</Label>
            <Input id="current" type="password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New Password:</Label>
            <Input id="new" type="password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password:</Label>
            <Input id="confirm" type="password" />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit" className="min-w-[100px] rounded-full">
              Update
            </Button>
          </div>
        </form>
      </PortalFormCard>
    </PageWrapper>
  )
}
