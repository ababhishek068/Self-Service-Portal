import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Profile() {
  const { employee } = useAuth()

  return (
    <PageWrapper title="Profile" showPageHeading={false}>
      <PortalFormCard title="Employee Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employee No.</Label>
            <Input readOnly value={employee?.employeeNo ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input readOnly value={employee?.displayName ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input readOnly value={employee?.email ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>Job Title</Label>
            <Input readOnly value={employee?.jobTitle ?? ''} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Department</Label>
            <Input readOnly value={employee?.departmentName ?? ''} />
          </div>
        </div>
      </PortalFormCard>
    </PageWrapper>
  )
}
