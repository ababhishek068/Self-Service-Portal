/** Available payroll years for payslip & master roll selection. */
export const payrollYears = ['2025', '2026', '2027'] as const

/** Calendar month names used across payroll-related screens. */
export const payrollMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export type PayrollYear = (typeof payrollYears)[number]
export type PayrollMonth = (typeof payrollMonths)[number]
