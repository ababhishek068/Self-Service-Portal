import { FileUp, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Attachment } from '@/types/erp.types'

interface FileUploadProps {
  files: Attachment[]
  onChange: (files: Attachment[]) => void
}

export function FileUpload({ files, onChange }: FileUploadProps) {
  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const uploaded = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      size: file.size,
      progress: 100,
      uploadedAt: new Date().toISOString(),
    }))
    onChange([...files, ...uploaded])
  }

  const removeFile = (id: string) => onChange(files.filter((file) => file.id !== id))

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50">
        <FileUp className="h-6 w-6 text-emerald-700" />
        <span className="mt-2 text-sm font-medium text-slate-800">Upload supporting files</span>
        <span className="text-xs text-slate-500">All formats accepted</span>
        <input className="sr-only" type="file" multiple onChange={(event) => addFiles(event.target.files)} />
      </label>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{file.fileName}</p>
                  <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full bg-emerald-600" style={{ width: `${file.progress}%` }} />
                  </div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove file" onClick={() => removeFile(file.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
