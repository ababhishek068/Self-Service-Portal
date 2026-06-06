import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAttendanceRecords,
  listTeamAttendanceRecords,
  signInAttendance,
  signOutAttendance,
  type AttendanceRow,
} from '@/api/endpoints/attendance'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'

function calcHoursWorked(timeIn: string, timeOut: string): string {
  if (!timeIn || !timeOut) return ''
  const [inH, inM] = timeIn.split(':').map(Number)
  const [outH, outM] = timeOut.split(':').map(Number)
  const minutes = outH * 60 + outM - (inH * 60 + inM)
  if (minutes <= 0) return ''
  return (minutes / 60).toFixed(2)
}

export function Attendance() {
  const { employee } = useAuth()
  const { isHOD } = usePermissions()
  const queryClient = useQueryClient()
  const useDb = Boolean(env.AUTH_API_URL) && !env.USE_MOCK
  const [localRows, setLocalRows] = useState<AttendanceRow[]>([])
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const staffName = employee?.displayName ?? 'Employee'
  const isHod = isHOD
  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'mine'],
    queryFn: listAttendanceRecords,
    enabled: useDb,
  })
  const teamAttendanceQuery = useQuery({
    queryKey: ['attendance', 'team'],
    queryFn: listTeamAttendanceRecords,
    enabled: useDb && Boolean(isHod),
  })
  const rows = useDb ? (attendanceQuery.data ?? []) : localRows

  const hodTeamRows = useMemo(
    () =>
      useDb
        ? (teamAttendanceQuery.data ?? [])
        : isHod
        ? [
            { id: 'hod-1', date: new Date().toISOString().slice(0, 10), staffName: 'Team Member 1', timeIn: '08:05', timeOut: '17:10', hoursWorked: '9.08', location: '9.03, 38.74', comments: '' },
            { id: 'hod-2', date: new Date().toISOString().slice(0, 10), staffName: 'Team Member 2', timeIn: '08:00', timeOut: '', hoursWorked: '', location: '9.03, 38.74', comments: 'Signed in' },
          ]
        : [],
    [isHod, teamAttendanceQuery.data, useDb],
  )

  const captureLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('Location unavailable')
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => resolve('Location denied'),
        { enableHighAccuracy: true, timeout: 8000 },
      )
    })

  const signIn = async () => {
    setFetchingLocation(true)
    const location = await captureLocation()
    setFetchingLocation(false)
    setLocationStatus(location)

    if (useDb) {
      await signInAttendance(location)
      await queryClient.invalidateQueries({ queryKey: ['attendance'] })
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 5)
    setLocalRows((current) => [
      {
        id: crypto.randomUUID(),
        date: today,
        staffName,
        timeIn: now,
        timeOut: '',
        hoursWorked: '',
        location,
        comments: location === 'Location denied' ? 'Signed in without coordinates' : 'Signed in',
        highlight: true,
      },
      ...current.map((row) => ({ ...row, highlight: false })),
    ])
  }

  const signOut = () => {
    if (useDb) {
      signOutAttendance()
        .then(() => queryClient.invalidateQueries({ queryKey: ['attendance'] }))
        .finally(() => setConfirmSignOut(false))
      return
    }
    const now = new Date().toTimeString().slice(0, 5)
    setLocalRows((current) =>
      current.map((row, index) =>
        index === 0 && !row.timeOut
          ? {
              ...row,
              timeOut: now,
              hoursWorked: calcHoursWorked(row.timeIn, now),
              comments: 'Signed out',
              highlight: true,
            }
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
    { id: 'location', header: 'Coordinates', cell: (row) => row.location || '—' },
    { id: 'comments', header: 'Comments', cell: (row) => row.comments },
  ]

  return (
    <PageWrapper
      title="Attendance"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="success"
            className="rounded-full px-5"
            onClick={signIn}
            disabled={fetchingLocation}
          >
            {fetchingLocation ? 'Getting location…' : 'Sign-in Today'}
          </Button>
          <Button type="button" variant="action" className="rounded-full px-5" onClick={() => setConfirmSignOut(true)}>
            Sign-out Today
          </Button>
        </div>
      }
    >
      {locationStatus ? (
        <p className="mb-3 text-sm text-slate-600">
          Last sign-in coordinates: <span className="font-medium">{locationStatus}</span>
        </p>
      ) : null}

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle="No attendance records yet. Use Sign-in Today to record your attendance."
        selectedRowId={rows.find((row) => row.highlight)?.id}
      />

      {isHod ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--portal-navy)]">HOD — Staff Attendees Today</h3>
          <DataTable rows={hodTeamRows} columns={columns} getRowId={(row) => row.id} compact />
        </div>
      ) : null}

      {confirmSignOut ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <p className="text-sm font-medium text-slate-800">Confirm sign-out for today?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmSignOut(false)}>
                Cancel
              </Button>
              <Button type="button" variant="action" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
