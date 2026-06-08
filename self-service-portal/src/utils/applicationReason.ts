/** Extract the applicant's reason/description from a request payload. */
export function extractApplicationReason(
  payload: Record<string, unknown> | undefined,
  title?: string,
): string {
  if (!payload) return title?.trim() ?? ''

  const keys = [
    'reason',
    'description',
    'justification',
    'purpose',
    'issueDescription',
    'comments',
    'notes',
    'remarks',
  ]

  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return title?.trim() ?? ''
}
