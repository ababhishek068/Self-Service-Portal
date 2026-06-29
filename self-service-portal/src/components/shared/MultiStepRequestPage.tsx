import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Download, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  type FieldValues,
  type Resolver,
  type UseFormReturn,
  useForm,
  useWatch,
} from 'react-hook-form'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { useToast } from '@/components/feedback/ToastProvider'
import { useConfirm } from '@/components/feedback/ConfirmProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type DataTableColumn } from './DataTable'
import { FileUpload } from './FileUpload'
import { StatusBadge } from './StatusBadge'
import { RequestProgress } from './RequestProgress'
import { ApprovalHistory } from './ApprovalHistory'
import type { DetailFieldConfig, FieldConfig } from './RequestFormPage'
import {
  addRequestLine,
  cancelModuleRequest,
  createModuleRequest,
  deleteRequestAttachment,
  deleteRequestLine,
  downloadRequestAttachment,
  getModuleRequest,
  postStoreRequestReceipt,
  receiveStoreRequestLine,
  setRequestLines,
  submitModuleRequest,
  updateRequestHeader,
  updateRequestLine,
  uploadRequestAttachment,
  type EndpointConfig,
} from '@/api/endpoints/requestEndpoint'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Attachment, PortalRequest } from '@/types/erp.types'

export interface LineColumn {
  key: string
  header: string
  format?: (value: unknown, line: Record<string, unknown>) => ReactNode
}

export interface MultiStepLineConfig {
  /** Section heading, e.g. "Claim Lines". */
  label: string
  addLabel?: string
  schema: Parameters<typeof zodResolver>[0]
  defaultValues: FieldValues
  fields: FieldConfig[]
  columns: LineColumn[]
  /** Map line form values to the API payload (defaults to identity). */
  buildLinePayload?: (values: FieldValues) => Record<string, unknown>
  /** When false, lines are created by the backend and only edited inline (e.g. imprest surrender). */
  canAdd?: boolean
  /** ESS modules without a line-update SOAP method can still add/delete lines. */
  canEdit?: boolean
  /** Inline-editable cell fields for backend-generated lines (keyed by line property). */
  editableFields?: FieldConfig[]
  emptyText?: string
}

export interface MultiStepRequestConfig {
  title: string
  description?: string
  businessRules?: string[]
  module: EndpointConfig
  queryKey: readonly unknown[]
  listRequests: () => Promise<PortalRequest[]>
  /** Header create form. */
  headerSchema: Parameters<typeof zodResolver>[0]
  headerDefaults: FieldValues
  headerFields: FieldConfig[]
  /** Optional read-only content derived from the current header form values. */
  headerSupplement?: (values: FieldValues) => ReactNode
  /** Map header form values to the create payload (defaults to identity). */
  buildHeaderPayload?: (values: FieldValues) => Record<string, unknown>
  line?: MultiStepLineConfig
  newButtonLabel?: string
  headerLabel?: string
  initialMode?: 'list' | 'create'
  /** Curated fields shown on the detail screen. Undefined values are hidden. */
  detailFields?: DetailFieldConfig[]
  /** Statuses from which Business Central allows cancellation. */
  cancelStatuses?: PortalRequest['status'][]
}

function pathValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[part]
  }, source)
}

function firstPathValue(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = pathValue(source, path)
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return undefined
}

function detailValue(value: unknown, format: DetailFieldConfig['format'] = 'text') {
  if (format === 'status') return <StatusBadge status={String(value ?? '-')} />
  if (format === 'date') return formatDate(value === undefined ? undefined : String(value))
  if (format === 'currency') return formatCurrency(Number(value ?? 0))
  if (format === 'percentage') return `${Number(value ?? 0)}%`
  if (format === 'returned') {
    const returned = value === true || ['true', 'yes', '1'].includes(String(value ?? '').toLowerCase())
    return returned ? 'Returned' : 'Not Returned'
  }
  return String(value ?? '-')
}

function normalizedFieldName(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function initialFieldValue(source: Record<string, unknown>, field: FieldConfig, fallback: unknown) {
  const mapped = (value: unknown) => {
    const key = String(value ?? '').trim().toLowerCase()
    return field.valueMap?.[key] ?? value
  }
  for (const path of field.valuePaths ?? [field.name]) {
    const value = pathValue(source, path)
    if (value !== undefined && value !== null) return mapped(value)
  }
  const target = normalizedFieldName(field.name)
  const key = Object.keys(source).find((candidate) => normalizedFieldName(candidate) === target)
  return key ? mapped(source[key]) : fallback
}

function fieldRenderer(form: UseFormReturn<FieldValues>, prefix = '', watchedValues: unknown = {}) {
  return function renderField(field: FieldConfig) {
    const name = prefix ? `${prefix}.${field.name}` : field.name
    const inputId = name.replaceAll('.', '-')
    const error = form.formState.errors?.[field.name]
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
    const options = field.optionsByField
      ? field.optionsByField.options[String(pathValue(watchedValues, field.optionsByField.field) ?? '')] ?? []
      : field.options ?? []
    return (
      <div key={name} className={field.type === 'checkbox' ? 'flex items-center gap-2' : 'space-y-1.5'}>
        {field.type !== 'checkbox' ? <Label htmlFor={inputId}>{field.label}</Label> : null}
        {field.type === 'textarea' ? (
          <Textarea id={inputId} placeholder={field.placeholder} readOnly={field.readOnly} {...form.register(name)} />
        ) : null}
        {field.type === 'select' ? (
          <Select id={inputId} placeholder={field.placeholder ?? 'Select'} options={options} disabled={field.readOnly} {...form.register(name)} />
        ) : null}
        {['text', 'number', 'date'].includes(field.type) ? (
          <Input id={inputId} type={field.type} placeholder={field.placeholder} readOnly={field.readOnly} {...form.register(name)} />
        ) : null}
        {field.type === 'checkbox' ? (
          <>
            <input id={inputId} type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register(name)} />
            <Label htmlFor={inputId}>{field.label}</Label>
          </>
        ) : null}
        {message ? <p className="text-xs font-medium text-red-600">{message}</p> : null}
      </div>
    )
  }
}

function HeaderForm({
  config,
  request,
  onCreated,
  onCancel,
}: {
  config: MultiStepRequestConfig
  request?: PortalRequest
  onCreated: (request: PortalRequest) => void
  onCancel: () => void
}) {
  const initialValues = request
    ? Object.fromEntries(
        config.headerFields.map((field) => [
          field.name,
          initialFieldValue(request.payload ?? {}, field, config.headerDefaults[field.name]),
        ]),
      )
    : config.headerDefaults
  const form = useForm<FieldValues>({
    resolver: zodResolver(config.headerSchema) as Resolver<FieldValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  })
  const watchedValues = useWatch({ control: form.control })
  const render = fieldRenderer(form, '', watchedValues)
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: FieldValues) => {
      const payload = config.buildHeaderPayload ? config.buildHeaderPayload(values) : values
      return request
        ? updateRequestHeader(request.id, payload)
        : createModuleRequest(config.module, { ...payload, submit: false })
    },
    onSuccess: (savedRequest) => {
      toast.success(
        request ? 'Request updated successfully.' : 'Draft created. Add lines, then request approval.',
        `${config.title} saved`,
      )
      onCreated(savedRequest)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not create the request', 'Save failed'),
  })

  return (
    <PageWrapper title={request ? `Edit ${config.title}` : config.headerLabel ?? config.title} showPageHeading={false}>
      <PortalFormCard title={request ? `Edit ${config.title}` : config.headerLabel ?? config.title}>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-3 sm:grid-cols-1 sm:gap-4 md:grid-cols-2">
            {config.headerFields.map((field) => render(field))}
          </div>
          {config.headerSupplement ? config.headerSupplement(watchedValues) : null}
          {config.description ? <p className="text-sm text-slate-600">{config.description}</p> : null}
          {mutation.error ? (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              {mutation.error instanceof Error ? mutation.error.message : 'Request failed'}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2 pt-2 sm:flex sm:flex-wrap sm:justify-center">
            <Button type="button" variant="outline" className="rounded-full" disabled={mutation.isPending} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={mutation.isPending}
              onClick={() => void form.handleSubmit((values) => mutation.mutate(values))()}
            >
              {mutation.isPending ? 'Saving…' : request ? 'Save changes' : 'Create draft'}
            </Button>
          </div>
        </form>
      </PortalFormCard>
    </PageWrapper>
  )
}

function AddLineForm({
  line,
  requestId,
  initialLine,
  onChanged,
  onCancel,
}: {
  line: MultiStepLineConfig
  requestId: string
  initialLine?: Record<string, unknown>
  onChanged: () => void
  onCancel?: () => void
}) {
  const initialValues = initialLine
    ? Object.fromEntries(
        line.fields.map((field) => [
          field.name,
          initialFieldValue(initialLine, field, line.defaultValues[field.name]),
        ]),
      )
    : line.defaultValues
  const form = useForm<FieldValues>({
    resolver: zodResolver(line.schema) as Resolver<FieldValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  })
  const watchedValues = useWatch({ control: form.control })
  const render = fieldRenderer(form, '', watchedValues)
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: FieldValues) => {
      const payload = line.buildLinePayload ? line.buildLinePayload(values) : values
      return initialLine
        ? updateRequestLine(requestId, String(initialLine.lineNo ?? initialLine.id), payload)
        : addRequestLine(requestId, payload)
    },
    onSuccess: () => {
      toast.success(initialLine ? 'Line updated' : 'Line added')
      form.reset(line.defaultValues)
      onCancel?.()
      onChanged()
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not add line', 'Line failed'),
  })
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{line.fields.map((field) => render(field))}</div>
      {mutation.error ? (
        <p className="mt-2 text-xs font-medium text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : 'Could not add line'}
        </p>
      ) : null}
      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={mutation.isPending} onClick={() => void form.handleSubmit((values) => mutation.mutate(values))()}>
            {initialLine ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {mutation.isPending ? 'Saving…' : initialLine ? 'Save line' : line.addLabel ?? 'Add line'}
          </Button>
          {initialLine ? <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </div>
    </div>
  )
}

function EditableLines({
  line,
  request,
  onChanged,
}: {
  line: MultiStepLineConfig
  request: PortalRequest
  onChanged: () => void
}) {
  const initial = useMemo(
    () => (Array.isArray(request.payload?.lines) ? (request.payload.lines as Record<string, unknown>[]) : []),
    [request.payload],
  )
  const [rows, setRows] = useState<Record<string, unknown>[]>(initial)
  useEffect(() => setRows(initial), [initial])
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (next: Record<string, unknown>[]) => setRequestLines(request.id, next),
    onSuccess: () => {
      toast.success('Lines updated successfully')
      onChanged()
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not update lines', 'Update failed'),
  })
  const editableNames = (line.editableFields ?? []).map((field) => field.name)
  const setCell = (index: number, key: string, value: unknown) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)))

  return (
    <div className="space-y-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500">
          <tr>{line.columns.map((column) => <th key={column.key} className="px-2 py-2">{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? row.lineNo ?? index)} className="border-b border-slate-100">
              {line.columns.map((column) => {
                const editable = line.editableFields?.find((field) => field.name === column.key)
                if (editable) {
                  return (
                    <td key={column.key} className="px-2 py-2">
                      {editable.type === 'select' ? (
                        <Select
                          options={editable.options ?? []}
                          placeholder={editable.placeholder ?? 'Select'}
                          value={String(row[column.key] ?? '')}
                          onChange={(event) => setCell(index, column.key, event.target.value)}
                        />
                      ) : (
                        <Input
                          type={editable.type === 'number' ? 'number' : 'text'}
                          value={String(row[column.key] ?? '')}
                          onChange={(event) => setCell(index, column.key, event.target.value)}
                        />
                      )}
                    </td>
                  )
                }
                return (
                  <td key={column.key} className="px-2 py-2">
                    {column.format ? column.format(row[column.key], row) : String(row[column.key] ?? '')}
                  </td>
                )
              })}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={line.columns.length} className="px-2 py-4 text-center text-slate-500">
                {line.emptyText ?? 'No lines.'}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {editableNames.length && rows.length ? (
        <Button type="button" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate(rows)}>
          Save
        </Button>
      ) : null}
    </div>
  )
}

export function MultiStepRequestPage(config: MultiStepRequestConfig) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [mode, setMode] = useState<'list' | 'create'>(config.initialMode ?? 'list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [editingHeader, setEditingHeader] = useState(false)
  const [editingLine, setEditingLine] = useState<Record<string, unknown> | null>(null)
  const [showLineForm, setShowLineForm] = useState(false)
  const [attachmentDesc, setAttachmentDesc] = useState('')
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([])
  const [receiveLine, setReceiveLine] = useState<Record<string, unknown> | null>(null)
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReason, setReceiveReason] = useState('')

  const requestsQuery = useQuery({ queryKey: config.queryKey, queryFn: config.listRequests })
  const detailQuery = useQuery({
    queryKey: [...config.queryKey, 'detail', selectedId],
    queryFn: () => getModuleRequest(config.module, selectedId!),
    enabled: Boolean(selectedId),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: config.queryKey })
    if (['storeRequisition', 'transferOrder'].includes(config.module.module)) {
      await queryClient.invalidateQueries({ queryKey: ['facility', 'gate-pass'] })
    }
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    await queryClient.invalidateQueries({ queryKey: ['approvals'] })
    if (selectedId) await detailQuery.refetch()
  }

  const headerCreated = (request: PortalRequest) => {
    void queryClient.invalidateQueries({ queryKey: config.queryKey })
    if (['storeRequisition', 'transferOrder'].includes(config.module.module)) {
      void queryClient.invalidateQueries({ queryKey: ['facility', 'gate-pass'] })
    }
    setMode('list')
    setSelectedId(request.id)
  }

  const runAction = async (
    id: string,
    action: () => Promise<unknown>,
    errorLabel: string,
    successMessage?: string,
  ) => {
    setActionId(id)
    try {
      await action()
      await refresh()
      if (successMessage) toast.success(successMessage)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : errorLabel, 'Action failed')
    } finally {
      setActionId(null)
    }
  }

  const selected = detailQuery.data
  const editable = selected ? selected.status === 'Draft' : false
  const cancelStatuses = config.cancelStatuses ?? ['Pending Approval']
  const canReceiveStoreLines = selected?.status === 'Posted' && config.module.module === 'storeRequisition'

  const uploadAttachments = async () => {
    if (!selected || pendingFiles.length === 0) return
    setActionId('upload')
    try {
      for (const file of pendingFiles) {
        await uploadRequestAttachment(selected.id, {
          fileName: file.fileName,
          fileType: file.fileType,
          size: file.size,
          contentBase64: file.contentBase64,
          description: attachmentDesc || file.description || file.fileName,
        })
      }
      setPendingFiles([])
      setAttachmentDesc('')
      await refresh()
      toast.success('Attachment uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Attachment upload failed', 'Upload failed')
    } finally {
      setActionId(null)
    }
  }

  const beginReceiveLine = (line: Record<string, unknown>) => {
    setReceiveLine(line)
    setReceiveQuantity(String(line.quantityToReceive ?? line.quantityIssued ?? line.quantity ?? ''))
    setReceiveReason(String(line.reason ?? ''))
  }

  const submitReceiveLine = async () => {
    if (!selected || !receiveLine) return
    const lineId = String(receiveLine.id ?? receiveLine.lineNo ?? '')
    const quantityToReceive = Number(receiveQuantity)
    if (!lineId || !Number.isFinite(quantityToReceive) || quantityToReceive < 0) {
      toast.error('Enter a valid quantity to receive.', 'Receive failed')
      return
    }
    await runAction(
      `receive-${lineId}`,
      () => receiveStoreRequestLine(selected.id, lineId, {
        quantityToReceive,
        reason: receiveReason,
      }),
      'Receive failed',
      'Store line received',
    )
    setReceiveLine(null)
    setReceiveQuantity('')
    setReceiveReason('')
  }

  const postStoreReceipt = async () => {
    if (!selected) return
    const yes = await confirm({
      title: 'Post to receive',
      message: 'Post this store requisition receipt in Business Central?',
      confirmLabel: 'Post',
    })
    if (!yes) return
    await runAction(
      `post-${selected.id}`,
      () => postStoreRequestReceipt(selected.id),
      'Post failed',
      'Store requisition posted to receive',
    )
  }

  // Detail view
  if (selectedId) {
    const payload = selected?.payload ?? {}
    const lines = Array.isArray(payload.lines) ? (payload.lines as Record<string, unknown>[]) : []
    const detailSource = { request: selected, payload }
    const detailFields = (config.detailFields ?? [])
      .map((field) => ({ field, value: firstPathValue(detailSource, field.paths) }))
      .filter(({ value }) => value !== undefined)
    const headerFields = config.headerFields
      .map((field) => ({
        field,
        value: initialFieldValue(payload, field, undefined),
      }))
      .filter(({ value }) => value !== null && value !== undefined && value !== '')

    if (selected && editingHeader) {
      return (
        <HeaderForm
          config={config}
          request={selected}
          onCreated={() => {
            setEditingHeader(false)
            void refresh()
          }}
          onCancel={() => setEditingHeader(false)}
        />
      )
    }

    return (
      <PageWrapper title={`${config.title} Details`} showPageHeading={false}>
        <PortalFormCard title={`${config.title} Details`}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <Button type="button" variant="outline" onClick={() => { setSelectedId(null); setEditingLine(null); setShowLineForm(false); setEditingHeader(false); setMode('list') }}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {selected ? (
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'Draft' ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingHeader(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                  {selected.status === 'Draft' ? (
                    <Button
                      type="button"
                      variant="gradient"
                      disabled={actionId === selected.id}
                      onClick={() => {
                        if (config.line && lines.length === 0) {
                          toast.warning(`Add at least one ${config.line.label.toLowerCase()} entry before requesting approval.`, 'Lines required')
                          return
                        }
                        void confirm({
                          title: 'Request approval',
                          message: 'Send this request into the approval workflow?',
                          confirmLabel: 'Request Approval',
                        }).then((yes) => {
                          if (yes)
                            void runAction(
                              selected.id,
                              () => submitModuleRequest(config.module, selected.id),
                              'Submission failed',
                              'Request sent for approval',
                            )
                        })
                      }}
                    >
                      <Send className="h-4 w-4" />
                      Request Approval
                    </Button>
                  ) : null}
                  {cancelStatuses.includes(selected.status) ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionId === selected.id}
                      onClick={() =>
                        void confirm({
                          title: 'Cancel request',
                          message: 'Are you sure you want to cancel this request?',
                          confirmLabel: 'Cancel Request',
                          cancelLabel: 'Keep',
                          tone: 'danger',
                        }).then((yes) => {
                          if (yes)
                            void runAction(
                              selected.id,
                              () => cancelModuleRequest(config.module, selected.id),
                              'Cancel failed',
                              'Request cancelled',
                            )
                        })
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                  {canReceiveStoreLines ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionId === `post-${selected.id}`}
                      onClick={() => void postStoreReceipt()}
                    >
                      Post to receive
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {detailQuery.isLoading ? <Skeleton className="h-56 w-full" /> : null}
            {detailQuery.isError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {detailQuery.error instanceof Error ? detailQuery.error.message : 'Could not load this request.'}
              </div>
            ) : null}

            {selected ? (
              <>
                <RequestProgress status={selected.status} hasLines={lines.length > 0} requiresLines={Boolean(config.line)} />
                <section>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {detailFields.length ? detailFields.map(({ field, value }) => (
                      <div key={field.label}>
                        <p className="text-xs text-slate-500">{field.label}</p>
                        <div className="font-semibold">{detailValue(value, field.format)}</div>
                      </div>
                    )) : (
                      <>
                        <div><p className="text-xs text-slate-500">Request No.</p><p className="font-semibold">{selected.requestNo}</p></div>
                        <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={selected.status} /></div>
                        <div><p className="text-xs text-slate-500">Created</p><p className="font-semibold">{formatDate(selected.createdAt)}</p></div>
                      </>
                    )}
                  </div>
                </section>

                {!detailFields.length && headerFields.length ? (
                  <section className="border-t border-slate-200 pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">Request Information</h3>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {headerFields.map(({ field, value }) => (
                        <div key={field.name}>
                          <dt className="text-xs text-slate-500">{field.label}</dt>
                          <dd className="break-words text-sm font-medium">
                            {field.type === 'date' ? formatDate(String(value)) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}

                {/* Attachments */}
                <section className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">Attachments</h3>
                  {['Draft', 'Pending Approval'].includes(selected.status) ? (
                    <div className="mb-4 space-y-3 rounded-md border border-slate-200 p-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="attachment-desc">Attachment Description / Name</Label>
                        <Input id="attachment-desc" value={attachmentDesc} onChange={(event) => setAttachmentDesc(event.target.value)} placeholder="e.g. Receipt" />
                      </div>
                      <FileUpload files={pendingFiles} onChange={setPendingFiles} />
                      <p className="text-xs text-slate-500">
                        Selected files are uploaded to Business Central only after you click Upload attachments.
                      </p>
                      <Button type="button" size="sm" disabled={actionId === 'upload' || pendingFiles.length === 0} onClick={() => void uploadAttachments()}>
                        {actionId === 'upload' ? 'Uploading...' : 'Upload attachments'}
                      </Button>
                    </div>
                  ) : null}
                  {selected.attachments.length ? (
                    <div className="divide-y divide-slate-100 border-y border-slate-200">
                      {selected.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{attachment.description || attachment.fileName}</p>
                            <p className="text-xs text-slate-500">{attachment.fileName}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={actionId === attachment.id} onClick={() => void runAction(attachment.id, () => downloadRequestAttachment(selected.id, attachment), 'Download failed')}>
                              <Download className="h-4 w-4" />
                              View/Download
                            </Button>
                            {['Draft', 'Pending Approval'].includes(selected.status) ? (
                              <Button type="button" variant="ghost" size="sm" className="text-red-600" disabled={actionId === attachment.id} onClick={() => void runAction(attachment.id, () => deleteRequestAttachment(selected.id, attachment.id), 'Delete failed')}>
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm italic text-slate-500">*** No attachments ***</p>}
                </section>

                {/* Lines */}
                {config.line ? (
                  <section className="border-t border-slate-200 pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">{config.line.label}</h3>
                    {editable && config.line.canAdd !== false ? (
                      <div className="mb-4">
                        {showLineForm || editingLine ? (
                          <AddLineForm
                            line={config.line}
                            requestId={selected.id}
                            initialLine={editingLine ?? undefined}
                            onCancel={() => {
                              setEditingLine(null)
                              setShowLineForm(false)
                            }}
                            onChanged={() => {
                              setEditingLine(null)
                              setShowLineForm(false)
                              void refresh()
                            }}
                          />
                        ) : (
                          <Button type="button" size="sm" onClick={() => setShowLineForm(true)}>
                            <Plus className="h-4 w-4" />
                            {config.line.addLabel ?? 'New Line'}
                          </Button>
                        )}
                      </div>
                    ) : null}
                    {canReceiveStoreLines && receiveLine ? (
                      <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">
                          Receive line {String(receiveLine.lineNo ?? receiveLine.id ?? '')}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="receive-quantity">Quantity To Receive</Label>
                            <Input
                              id="receive-quantity"
                              type="number"
                              min="0"
                              value={receiveQuantity}
                              onChange={(event) => setReceiveQuantity(event.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="receive-reason">Reason</Label>
                            <Input
                              id="receive-reason"
                              value={receiveReason}
                              onChange={(event) => setReceiveReason(event.target.value)}
                              placeholder="Optional reason"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={actionId === `receive-${String(receiveLine.id ?? receiveLine.lineNo ?? '')}`}
                            onClick={() => void submitReceiveLine()}
                          >
                            Submit
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setReceiveLine(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {config.line.editableFields?.length ? (
                      <EditableLines line={config.line} request={selected} onChanged={() => void refresh()} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-200 text-xs text-slate-500">
                            <tr>
                              {config.line.columns.map((column) => <th key={column.key} className="px-2 py-2">{column.header}</th>)}
                              {editable || canReceiveStoreLines ? <th className="px-2 py-2">Action</th> : null}
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map((row, index) => (
                              <tr key={String(row.id ?? row.lineNo ?? index)} className="border-b border-slate-100">
                                {config.line!.columns.map((column) => (
                                  <td key={column.key} className="px-2 py-2">
                                    {column.format ? column.format(row[column.key], row) : String(row[column.key] ?? '')}
                                  </td>
                                ))}
                                {editable ? (
                                  <td className="px-2 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {config.line!.canEdit !== false ? (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingLine(row); setShowLineForm(true) }}>
                                          <Pencil className="h-4 w-4" />
                                          Edit
                                        </Button>
                                      ) : null}
                                      <Button type="button" variant="ghost" size="sm" className="text-red-600" disabled={actionId === String(row.id)} onClick={() => void runAction(String(row.id), () => deleteRequestLine(selected.id, String(row.id ?? row.lineNo)), 'Delete failed', 'Line deleted')}>
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                ) : canReceiveStoreLines ? (
                                  <td className="px-2 py-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={actionId === `receive-${String(row.id ?? row.lineNo ?? '')}`}
                                      onClick={() => beginReceiveLine(row)}
                                    >
                                      Receive Items
                                    </Button>
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                            {lines.length === 0 ? (
                              <tr>
                                <td colSpan={config.line.columns.length + (editable || canReceiveStoreLines ? 1 : 0)} className="px-2 py-4 text-center text-slate-500">
                                  {config.line.emptyText ?? '*** No lines found ***'}
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ) : null}

                <section className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--portal-navy)]">Approval History</h3>
                  <ApprovalHistory steps={selected.approvalSteps} />
                </section>
              </>
            ) : null}
          </div>
        </PortalFormCard>
      </PageWrapper>
    )
  }

  if (mode === 'create') {
    return <HeaderForm config={config} onCreated={headerCreated} onCancel={() => setMode('list')} />
  }

  const columns: DataTableColumn<PortalRequest>[] = [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.createdAt) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'title', header: 'Description', cell: (row) => row.title },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(row.id)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <PageWrapper title={config.title} actions={<PortalNewButton label={config.newButtonLabel ?? 'New Request'} onClick={() => setMode('create')} />}>
      {config.businessRules?.length ? (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <ul className="list-inside list-disc space-y-0.5 text-blue-800">
            {config.businessRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
      ) : null}
      {requestsQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : requestsQuery.isError ? (
        <div className="rounded border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
          Could not load requests. Check the selected backend and apply pending database migrations.
        </div>
      ) : (
        <DataTable rows={requestsQuery.data ?? []} columns={columns} getRowId={(row) => row.id} onRowClick={(row) => setSelectedId(row.id)} compact />
      )}
    </PageWrapper>
  )
}
