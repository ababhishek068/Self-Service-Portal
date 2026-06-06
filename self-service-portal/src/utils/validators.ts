import { isSameDay, parseISO } from 'date-fns'

export const workingDate = () => new Date()

export function isErpWorkingDate(value: string) {
  return isSameDay(parseISO(value), workingDate())
}

export function buildFaTagNumber(
  departmentCode: string,
  categoryCode: string,
  itemCode: string,
  sequence: number,
  year = new Date().getFullYear(),
) {
  const seq = String(sequence).padStart(4, '0')
  return `FA/${departmentCode}/${categoryCode}/${itemCode}/${seq}/${year}`
}

export function isMakerAllowedToApprove(makerEmployeeNo: string, approverEmployeeNo: string) {
  return makerEmployeeNo !== approverEmployeeNo
}

export function isDuplicateWithin24Hours(existingDateIso: string, candidateDateIso: string) {
  const existing = parseISO(existingDateIso).getTime()
  const candidate = parseISO(candidateDateIso).getTime()
  return Math.abs(candidate - existing) <= 24 * 60 * 60 * 1000
}
