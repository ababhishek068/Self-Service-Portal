import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { downloadPolicyDocument, listPolicyDocuments } from '@/api/endpoints/documents'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'

export function Documents() {
  const query = useQuery({ queryKey: ['downloads', 'documents'], queryFn: listPolicyDocuments })
  const documents = query.data ?? []

  return (
    <PageWrapper
      title="Document Downloads"
      description="HR policies, forms and guidelines available for download."
    >
      {query.isLoading ? <div className="portal-panel p-4 text-sm text-slate-600">Loading documents...</div> : null}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => void downloadPolicyDocument(doc)}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        ))}
      </div>
      {!query.isLoading && documents.length === 0 ? (
        <div className="portal-panel p-4 text-sm text-slate-600">No documents found.</div>
      ) : null}
    </PageWrapper>
  )
}
