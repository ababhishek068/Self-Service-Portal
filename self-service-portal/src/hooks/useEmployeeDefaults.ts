import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

/** Read-only ERP fields pre-filled from the logged-in employee profile. */
export function useEmployeeDefaults() {
  const { employee } = useAuth()

  return useMemo(
    () => ({
      departmentCode: employee?.departmentCode ?? '',
      jobGrade: employee?.jobGrade ?? '',
      placeOfDuty: employee?.placeOfDuty ?? '',
      employeeAccountNumber: employee?.accountNumber ?? '',
      responsibleCenter: employee?.responsibleCenter ?? '',
    }),
    [
      employee?.departmentCode,
      employee?.jobGrade,
      employee?.placeOfDuty,
      employee?.accountNumber,
      employee?.responsibleCenter,
    ],
  )
}
