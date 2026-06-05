/** Hospital coverage tiers used by medical staff claims. */
export const hospitalCoverage = [
  { category: 'Panel Hospital A', coveragePercent: 90 },
  { category: 'Panel Hospital B', coveragePercent: 80 },
  { category: 'Non-panel Hospital', coveragePercent: 50 },
] as const

export type HospitalCoverageTier = (typeof hospitalCoverage)[number]
