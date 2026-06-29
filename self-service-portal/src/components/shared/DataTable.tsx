import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  emptyTitle?: string
  emptyAction?: ReactNode
  selectedRowId?: string
  compact?: boolean
  /** When provided, rows become clickable with hover affordance. */
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  emptyTitle,
  emptyAction,
  selectedRowId,
  compact = false,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const pageSize = compact ? 20 : 10
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const pagedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, rows])

  return (
    <div className="animate-page-in space-y-3 transition-opacity duration-300">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.id}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody key={page} className="portal-row-stagger">
          {pagedRows.length > 0 ? (
            pagedRows.map((row) => {
              const rowId = getRowId(row)
              return (
                <TableRow
                  key={rowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    onRowClick && 'portal-row-click',
                    selectedRowId === rowId && 'bg-[var(--portal-green-light)]! text-white hover:bg-[var(--portal-green-light)]!',
                  )}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} className={selectedRowId === rowId ? 'text-white' : undefined}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <p className="text-base font-medium italic text-slate-500">{emptyTitle ?? '*** No records Found ***'}</p>
                <p className="mt-1 text-xs text-slate-400">Create a new request to get started</p>
                {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {rows.length > pageSize ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600 sm:text-sm">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
              disabled={page === pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
