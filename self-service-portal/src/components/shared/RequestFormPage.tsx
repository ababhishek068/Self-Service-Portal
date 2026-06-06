import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import {
  Controller,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
  useForm,
  useWatch,
} from 'react-hook-form'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { PortalNewButton } from '@/components/shared/PortalNewButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, type SelectOption } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type DataTableColumn } from './DataTable'
import { FileUpload } from './FileUpload'
import { StatusBadge } from './StatusBadge'
import { cancelModuleRequest, deleteModuleRequest, type EndpointConfig } from '@/api/endpoints/requestEndpoint'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Attachment, PortalRequest } from '@/types/erp.types'

type BasicFieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'files'

export interface FieldConfig {
  name: string
  label: string
  type: BasicFieldType
  placeholder?: string
  options?: SelectOption[]
  readOnly?: boolean
}

export interface LineItemsConfig {
  name: string
  label: string
  type: 'lineItems'
  defaultLine: Record<string, unknown>
  fields: FieldConfig[]
}

export type RequestFieldConfig = FieldConfig | LineItemsConfig

interface RequestFormPageProps {
  title: string
  description?: string
  schema: Parameters<typeof zodResolver>[0]
  defaultValues: FieldValues
  fields: RequestFieldConfig[]
  queryKey: readonly unknown[]
  listRequests: () => Promise<PortalRequest[]>
  createRequest: (values: Record<string, unknown>) => Promise<unknown>
  businessRules?: string[]
  source?: string
  listOnly?: boolean
  newButtonLabel?: string
  /** When set, list rows get Cancel / Delete actions wired to the mock/ERP backend. */
  moduleConfig?: EndpointConfig
}

function getPathValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined
    if (Array.isArray(current)) return current[Number(part)]
    return (current as Record<string, unknown>)[part]
  }, source)
}

function LineItemsField({
  field,
  form,
  renderField,
}: {
  field: LineItemsConfig
  form: UseFormReturn<FieldValues>
  renderField: (field: FieldConfig) => ReactElement
}) {
  const watchedRows = useWatch({ control: form.control, name: field.name })
  const rows = (Array.isArray(watchedRows) ? watchedRows : []) as Record<string, unknown>[]
  const addLine = () => form.setValue(field.name, [...rows, field.defaultLine], { shouldDirty: true, shouldValidate: true })
  const removeLine = (index: number) =>
    form.setValue(
      field.name,
      rows.filter((_, currentIndex) => currentIndex !== index),
      { shouldDirty: true, shouldValidate: true },
    )

  return (
    <div className="col-span-full space-y-3 rounded border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <Label>{field.label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>
      <div className="space-y-3">
        {rows.map((_, index) => (
          <div key={`${field.name}-${index}`} className="rounded-md bg-slate-50 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {field.fields.map((item) => renderField({ ...item, name: `${field.name}.${index}.${item.name}` }))}
            </div>
            {rows.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" className="mt-2 text-red-600" onClick={() => removeLine(index)}>
                <Trash2 className="h-4 w-4" />
                Remove line
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RequestFormPage({
  title,
  description,
  schema,
  defaultValues,
  fields,
  queryKey,
  listRequests,
  createRequest,
  businessRules,
  listOnly = false,
  newButtonLabel = 'New Request',
  moduleConfig,
}: RequestFormPageProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const requestsQuery = useQuery({ queryKey, queryFn: listRequests })

  const refreshLists = async () => {
    await queryClient.invalidateQueries({ queryKey })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    await queryClient.invalidateQueries({ queryKey: ['approvals'] })
  }

  const handleCancel = async (id: string) => {
    if (!moduleConfig || !window.confirm('Cancel this request?')) return
    setActionId(id)
    try {
      await cancelModuleRequest(moduleConfig, id)
      await refreshLists()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cancel failed')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!moduleConfig || !window.confirm('Delete this draft permanently?')) return
    setActionId(id)
    try {
      await deleteModuleRequest(moduleConfig, id)
      await refreshLists()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionId(null)
    }
  }
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema) as Resolver<FieldValues>,
    defaultValues,
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: async () => {
      form.reset(defaultValues)
      setShowForm(false)
      await refreshLists()
    },
  })

  const errorFor = (name: string) => {
    const error = getPathValue(form.formState.errors, name)
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message ?? '')
    }
    return ''
  }

  const submit = (submitForApproval: boolean) =>
    form.handleSubmit((values) => {
      mutation.mutate({ ...values, submit: submitForApproval })
    })()

  const renderField = (field: FieldConfig) => {
    const error = errorFor(field.name)
    const inputId = field.name.replaceAll('.', '-')

    return (
      <div key={field.name} className={field.type === 'checkbox' ? 'flex items-center gap-2' : 'space-y-1.5'}>
        {field.type !== 'checkbox' ? <Label htmlFor={inputId}>{field.label}</Label> : null}
        {field.type === 'textarea' ? (
          <Textarea id={inputId} placeholder={field.placeholder} readOnly={field.readOnly} {...form.register(field.name)} />
        ) : null}
        {field.type === 'select' ? (
          <Select
            id={inputId}
            placeholder={field.placeholder ?? 'Select'}
            options={field.options ?? []}
            disabled={field.readOnly}
            {...form.register(field.name)}
          />
        ) : null}
        {['text', 'number', 'date'].includes(field.type) ? (
          <Input
            id={inputId}
            type={field.type}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
            {...form.register(field.name)}
          />
        ) : null}
        {field.type === 'checkbox' ? (
          <>
            <input id={inputId} type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register(field.name)} />
            <Label htmlFor={inputId}>{field.label}</Label>
          </>
        ) : null}
        {field.type === 'files' ? (
          <Controller
            control={form.control}
            name={field.name}
            render={({ field: fileField }) => (
              <FileUpload files={(fileField.value as Attachment[] | undefined) ?? []} onChange={fileField.onChange} />
            )}
          />
        ) : null}
        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    )
  }

  const columns: DataTableColumn<PortalRequest>[] = [
    { id: 'requestNo', header: 'No.', cell: (row) => row.requestNo },
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.createdAt) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'title', header: 'Description', cell: (row) => row.title },
    { id: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    ...(moduleConfig
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: (row: PortalRequest) => (
              <div className="flex gap-1">
                {row.status === 'Draft' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    disabled={actionId === row.id}
                    onClick={() => handleDelete(row.id)}
                  >
                    Delete
                  </Button>
                ) : null}
                {['Draft', 'Pending Approval'].includes(row.status) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-amber-700"
                    disabled={actionId === row.id}
                    onClick={() => handleCancel(row.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            ),
          } satisfies DataTableColumn<PortalRequest>,
        ]
      : []),
  ]

  if (showForm && !listOnly) {
    return (
      <PageWrapper title={title} showPageHeading={false}>
        <PortalFormCard title={title}>
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-3 sm:grid-cols-1 sm:gap-4 md:grid-cols-2">
              {fields.map((field) =>
                field.type === 'lineItems' ? (
                  <LineItemsField key={field.name} field={field} form={form} renderField={renderField} />
                ) : (
                  renderField(field)
                ),
              )}
            </div>
            {description ? <p className="text-sm text-slate-600">{description}</p> : null}
            {businessRules?.length ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">Business rules</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-blue-800">
                  {businessRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {mutation.error ? (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                {mutation.error instanceof Error ? mutation.error.message : 'Request failed'}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-2 pt-2 sm:flex sm:flex-wrap sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-full sm:order-1"
                disabled={mutation.isPending}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full sm:order-2"
                disabled={mutation.isPending}
                onClick={() => submit(false)}
              >
                <Save className="h-4 w-4" />
                Save draft
              </Button>
              <Button
                type="button"
                className="rounded-full sm:order-3"
                disabled={mutation.isPending}
                onClick={() => submit(true)}
              >
                <Send className="h-4 w-4" />
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
      title={title}
      actions={listOnly ? undefined : <PortalNewButton label={newButtonLabel} onClick={() => setShowForm(true)} />}
    >
      {requestsQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <DataTable rows={requestsQuery.data ?? []} columns={columns} getRowId={(row) => row.id} compact />
      )}
    </PageWrapper>
  )
}
