import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface AttendanceRow {
  id: string
  date: string
  staffName: string
  timeIn: string
  timeOut: string
  hoursWorked: string
  comments: string
  highlight?: boolean
}

const initialRows: AttendanceRow[] = [
  {
    id: '1',
    date: '2026-04-21',
    staffName: 'Beza Yoseff Abrehamm',
    timeIn: '08:00',
    timeOut: '17:00',
    hoursWorked: '9.00',
    comments: '-Signed in late by 761 minutes',
    highlight: true,
  },
  {
    id: '2',
    date: '2026-04-15',
    staffName: 'Beza Yoseff Abrehamm',
    timeIn: '08:15',
    timeOut: '17:05',
    hoursWorked: '8.83',
    comments: '',
  },
]

export function Attendance() {
  const { employee } = useAuth()
  const [rows, setRows] = useState(initialRows)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const staffName = employee?.displayName ?? 'Beza Yoseff Abrehamm'

  const signIn = () => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 5)
    setRows((current) => [
      {
        id: crypto.randomUUID(),
        date: today,
        staffName,
        timeIn: now,
        timeOut: '',
        hoursWorked: '',
        comments: '',
        highlight: true,
      },
      ...current.map((row) => ({ ...row, highlight: false })),
    ])
  }

  const signOut = () => {
    const now = new Date().toTimeString().slice(0, 5)
    setRows((current) =>
      current.map((row, index) =>
        index === 0 && !row.timeOut
          ? { ...row, timeOut: now, hoursWorked: '8.00', highlight: true }
          : { ...row, highlight: false },
      ),
    )
    setConfirmSignOut(false)
  }

  const columns: DataTableColumn<AttendanceRow>[] = [
    { id: 'date', header: 'Date', cell: (row) => row.date },
    { id: 'staff', header: 'Staff Name', cell: (row) => row.staffName },
    { id: 'in', header: 'Time In', cell: (row) => row.timeIn },
    { id: 'out', header: 'Time Out', cell: (row) => row.timeOut || '—' },
    { id: 'hours', header: 'Hours Worked', cell: (row) => row.hoursWorked || '—' },
    { id: 'comments', header: 'Comments', cell: (row) => row.comments },
  ]

  return (
    <PageWrapper
      title="Attendance"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="success" className="rounded-full px-5" onClick={signIn}>
            Sign-in Today
          </Button>
          <Button type="button" variant="action" className="rounded-full px-5" onClick={() => setConfirmSignOut(true)}>
            Sign-out Today
          </Button>
        </div>
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedRowId={rows.find((r) => r.highlight)?.id}
        compact
      />

      {confirmSignOut ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm text-slate-800">Are you sure you want to sign out?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmSignOut(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={signOut}>
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
