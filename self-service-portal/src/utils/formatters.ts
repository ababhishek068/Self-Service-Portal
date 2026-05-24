import { format, parseISO } from 'date-fns'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value)

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(value)

export const formatDate = (value?: string) => {
  if (!value) return '-'
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy')
}

export const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy, HH:mm')
}

export const percent = (value: number) => `${Math.round(value)}%`
