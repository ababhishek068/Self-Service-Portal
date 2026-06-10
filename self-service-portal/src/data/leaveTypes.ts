/**
 * Static leave type list used by the legacy Leave Statement filter dropdown.
 * For form submissions prefer `fetchLeaveTypes()` from `@/api/endpoints/leave`
 * which sources the catalog from Business Central via the Laravel ESS API.
 */
export const leaveTypes = [
  '--select--',
  'Annual Leave',
  'Postnatal Leave/Maternity',
  'Wedding Leave',
  'Mourning Leave',
  'Sick Leave',
  'Leave Without Pay',
  'Special Leave',
  'Prenatal Leave/Maternity',
  'Paternity Leave',
  'Half Day Leave',
] as const

export type LeaveTypeOption = (typeof leaveTypes)[number]
