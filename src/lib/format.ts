export function safeText(value: string | number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text.length ? text : fallback
}

export function formatDate(value: string | Date | null | undefined, fallback = '-'): string {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatCurrency(
  amount: string | number | null | undefined,
  currency = 'USD',
  fallback = '-'
): string {
  if (amount === null || amount === undefined || amount === '') return fallback
  const numeric = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(numeric)) return fallback
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numeric)
}

export function formatSalaryRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  currency = 'USD',
  fallback = '-'
): string {
  if ((min === null || min === undefined || min === '') && (max === null || max === undefined || max === '')) {
    return fallback
  }
  if (min !== null && min !== undefined && min !== '' && max !== null && max !== undefined && max !== '') {
    return `${formatCurrency(min, currency, fallback)} - ${formatCurrency(max, currency, fallback)}`
  }
  return min !== null && min !== undefined && min !== ''
    ? formatCurrency(min, currency, fallback)
    : formatCurrency(max, currency, fallback)
}

export function formatYears(value: string | number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || value === '') return fallback
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return numeric === 1 ? '1 year' : `${numeric} years`
}
