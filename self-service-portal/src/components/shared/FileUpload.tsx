import { FileUp, Paperclip, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Attachment } from '@/types/erp.types'

interface FileUploadProps {
  files: Attachment[]
  onChange: (files: Attachment[]) => void
}

export function FileUpload({ files, onChange }: FileUploadProps) {
  const [error, setError] = useState('')

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    setError('')
    const selected = Array.from(fileList)
    const allowed = new Set(['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'])
    const invalid = selected.find((file) => !allowed.has(file.name.split('.').pop()?.toLowerCase() ?? ''))
    if (invalid) {
      setError(`${invalid.name} is not an allowed file type.`)
      return
    }
    const oversized = selected.find((file) => file.size > 10_000_000)
    if (oversized) {
      setError(`${oversized.name} exceeds the 10 MB limit.`)
      return
    }
    const totalSize = [...files, ...selected].reduce(
      (total, file) => total + file.size,
      0,
    )
    if (totalSize > 20_000_000) {
      setError('Combined attachments cannot exceed 20 MB.')
      return
    }
    const uploaded = await Promise.all(
      selected.map(
        (file) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                size: file.size,
                progress: 100,
                uploadedAt: new Date().toISOString(),
                description: file.name.replace(/\.[^.]+$/, ''),
                contentBase64: String(reader.result ?? '').split(',')[1] ?? '',
              })
            reader.readAsDataURL(file)
          }),
      ),
    ).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Could not read the selected files.')
      return []
    })
    onChange([...files, ...uploaded])
  }

  const removeFile = (id: string) => onChange(files.filter((file) => file.id !== id))

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50">
        <FileUp className="h-6 w-6 text-emerald-700" />
        <span className="mt-2 text-sm font-medium text-slate-800">Upload supporting files</span>
        <span className="text-xs text-slate-500">PDF, DOC, DOCX, JPG or PNG. Maximum 10 MB each.</span>
        <input
          className="sr-only"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpeg,.jpg,.png"
          onChange={(event) => void addFiles(event.target.files)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{file.fileName}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
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
