import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface TrainingRow {
  id: string
  applicationNo: string
  date: string
  description: string
  status: string
}

const mockRows: TrainingRow[] = [
  { id: '1', applicationNo: 'TR-001', date: '2026-04-10', description: 'Leadership I', status: 'New' },
]

const trainingOptions = [
  '--select--',
  'Leadership I',
  'EXCUSION eXCELLENCE',
  'tot',
  'Dynamics Bc',
  'Induction Training',
  'UNivesal Training',
]

export function TrainingRequest() {
  const [showForm, setShowForm] = useState(false)
  const [rows] = useState(mockRows)
  const [trainingNeed, setTrainingNeed] = useState('')
  const [comments, setComments] = useState('')

  const columns: DataTableColumn<TrainingRow>[] = [
    { id: 'app', header: 'Application No.', cell: (row) => row.applicationNo },
    { id: 'date', header: 'Date', cell: (row) => row.date },
    { id: 'desc', header: 'Training Desc.', cell: (row) => row.description },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  if (showForm) {
    return (
      <PageWrapper title="New Training Request" showPageHeading={false}>
        <PortalFormCard title="New Training Request">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              setShowForm(false)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="trainingNeed">Training Need:</Label>
              <Select
                id="trainingNeed"
                value={trainingNeed}
                onChange={(event) => setTrainingNeed(event.target.value)}
                options={trainingOptions.map((value) => ({
                  label: value,
                  value: value === '--select--' ? '' : value,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comments">Comments:</Label>
              <Textarea id="comments" value={comments} onChange={(event) => setComments(event.target.value)} rows={4} />
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="min-w-[100px] rounded-full">
                Submit
              </Button>
            </div>
          </form>
        </PortalFormCard>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Training Requisitions List"
      actions={<PortalNewButton label="New Training" onClick={() => setShowForm(true)} />}
    >
      <DataTable rows={rows} columns={columns} getRowId={(row) => row.id} />
    </PageWrapper>
  )
}
