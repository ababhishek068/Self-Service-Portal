import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function DocumentRequisition() {
  return (
    <PageWrapper title="Document Requisition" showPageHeading={false}>
      <PortalFormCard title="Document Requisition">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="documentType">Document Type:</Label>
            <Select
              id="documentType"
              options={[
                { label: '--select--', value: '' },
                { label: 'Employment Letter', value: 'employment' },
                { label: 'Salary Certificate', value: 'salary' },
                { label: 'Service Certificate', value: 'service' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose:</Label>
            <Textarea id="purpose" rows={4} placeholder="Enter purpose for document request" />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit" className="min-w-[100px] rounded-full">
              Submit
            </Button>
          </div>
        </form>
      </PortalFormCard>
    </PageWrapper>
  )
}
