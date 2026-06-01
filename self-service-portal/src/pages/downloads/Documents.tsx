import { Download, FileText } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'

interface PolicyDocument {
  id: string
  title: string
  category: string
  updated: string
}

const documents: PolicyDocument[] = [
  { id: 'p1', title: 'HR Policy Manual', category: 'Policy', updated: '12 Mar 2026' },
  { id: 'p2', title: 'Code of Conduct', category: 'Policy', updated: '04 Feb 2026' },
  { id: 'p3', title: 'Leave Application Form', category: 'Form', updated: '20 Jan 2026' },
  { id: 'p4', title: 'Travel Claim Form', category: 'Form', updated: '12 Jan 2026' },
  { id: 'p5', title: 'Performance Appraisal Guidelines', category: 'Guideline', updated: '02 Jan 2026' },
]

export function Documents() {
  return (
    <PageWrapper
      title="Document Downloads"
      description="HR policies, forms and guidelines available for download."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="portal-card flex items-center gap-3 p-4"
          >
            <div className="portal-card-icon">
              <FileText className="h-6 w-6 text-[var(--portal-navy)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--portal-navy)]">{doc.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {doc.category} • Updated {doc.updated}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
