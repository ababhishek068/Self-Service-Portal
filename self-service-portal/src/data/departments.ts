/**
 * Static department catalog mirrored from Business Central. Only used for
 * dropdowns and as fallbacks when an API response is not yet wired up.
 */
export const departments = [
  { code: 'BO', name: 'Branch Operations', branchCode: 'HO', limit: 120000 },
  { code: 'FIN', name: 'Finance', branchCode: 'HO', limit: 180000 },
  { code: 'HR', name: 'Human Resources', branchCode: 'HO', limit: 90000 },
  { code: 'ITN', name: 'IT Network and Infrastructure', branchCode: 'HO', limit: 75000 },
  { code: 'FAC', name: 'Facility Management', branchCode: 'HO', limit: 150000 },
] as const

export type Department = (typeof departments)[number]
