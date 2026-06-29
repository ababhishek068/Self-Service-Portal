import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listAttendanceRecords,
  listTeamAttendanceRecords,
  signInAttendance,
  signOutAttendance,
} from '@/api/endpoints/attendance'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import type { AttendanceRow } from '@/api/endpoints/attendance'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/feedback/ToastProvider'

export function Attendance() {
  const { isHOD } = usePermissions()
  const queryClient = useQueryClient()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [attendanceAction, setAttendanceAction] = useState<'in' | 'out' | null>(null)
  const toast = useToast()

  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'mine'],
    queryFn: listAttendanceRecords,
  })
  const teamAttendanceQuery = useQuery({
    queryKey: ['attendance', 'team'],
    queryFn: listTeamAttendanceRecords,
    enabled: isHOD,
  })

  const rows = attendanceQuery.data ?? []
  const hodTeamRows = teamAttendanceQuery.data ?? []
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayRecord = rows.find((row) => row.date.slice(0, 10) === todayKey)
  const signedInToday = Boolean(todayRecord?.timeIn)
  const signedOutToday = Boolean(todayRecord?.timeOut)

  const formatClock = (value: string) => value ? value.replace(/\.\d+$/, '') : '—'

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
    setAttendanceAction('in')
    try {
      setFetchingLocation(true)
      const location = await captureLocation()
      setFetchingLocation(false)
      setLocationStatus(location)
      const result = await signInAttendance(location)
      await queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(result.comments || 'Attendance recorded successfully.', 'Signed in')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Attendance sign-in failed.', 'Sign-in failed')
    } finally {
      setFetchingLocation(false)
      setAttendanceAction(null)
    }
  }

  const signOut = async () => {
    setAttendanceAction('out')
    try {
      setFetchingLocation(true)
      const location = await captureLocation()
      setFetchingLocation(false)
      setLocationStatus(location)
      const result = await signOutAttendance(location)
      await queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(result.comments || 'Attendance sign-out recorded.', 'Signed out')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Attendance sign-out failed.', 'Sign-out failed')
    } finally {
      setFetchingLocation(false)
      setConfirmSignOut(false)
      setAttendanceAction(null)
    }
  }

  const columns: DataTableColumn<AttendanceRow>[] = [
    { id: 'date', header: 'Date', cell: (row) => row.date },
    { id: 'staff', header: 'Staff Name', cell: (row) => row.staffName },
    { id: 'in', header: 'Time In', cell: (row) => formatClock(row.timeIn) },
    { id: 'out', header: 'Time Out', cell: (row) => formatClock(row.timeOut) },
    { id: 'hours', header: 'Hours Worked', cell: (row) => row.hoursWorked ? Number(row.hoursWorked).toFixed(2) : '—' },
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
            disabled={fetchingLocation || attendanceAction !== null || signedInToday}
          >
            {attendanceAction === 'in'
              ? (fetchingLocation ? 'Getting location…' : 'Signing in…')
              : signedInToday
                ? `Signed in ${formatClock(todayRecord?.timeIn ?? '')}`
                : 'Sign-in Today'}
          </Button>
          <Button type="button" variant="action" className="rounded-full px-5" disabled={attendanceAction !== null || !signedInToday || signedOutToday} onClick={() => setConfirmSignOut(true)}>
            {signedOutToday ? `Signed out ${formatClock(todayRecord?.timeOut ?? '')}` : 'Sign-out Today'}
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

      {isHOD ? (
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
              <Button type="button" variant="action" disabled={attendanceAction === 'out'} onClick={() => void signOut()}>
                {attendanceAction === 'out' ? (fetchingLocation ? 'Getting location…' : 'Signing out…') : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
