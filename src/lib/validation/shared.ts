import { z } from 'zod'

export const cuid = z.string().trim().min(1, 'required')

export function optionalText(max = 1000) {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.union([z.string().max(max, 'too_long'), z.null()]).optional()
  ).transform((value) => (value === '' || value === undefined ? null : value))
}

export function requiredText(max = 255) {
  return z.string().trim().min(1, 'required').max(max, 'too_long')
}

export const optionalDateString = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.string(), z.null()]).optional()
).transform((value, ctx) => {
  if (value === '' || value === null || value === undefined) return null
  if (Number.isNaN(new Date(value).getTime())) {
    ctx.addIssue({ code: 'custom', message: 'invalid_date' })
    return z.NEVER
  }
  return value
})

export const requiredDateString = z.string().trim().min(1, 'required').transform((value, ctx) => {
  if (Number.isNaN(new Date(value).getTime())) {
    ctx.addIssue({ code: 'custom', message: 'invalid_date' })
    return z.NEVER
  }
  return value
})

export const requiredFutureDateString = requiredDateString.refine(
  (value) => new Date(value).getTime() > Date.now(),
  'date_must_be_future'
)

export const optionalFutureDateString = optionalDateString.refine(
  (value) => !value || new Date(value).getTime() > Date.now(),
  'date_must_be_future'
)

export function optionalNumericString(max = 50) {
  return z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : value),
    z.union([z.string().max(max, 'too_long'), z.null()]).optional()
  ).transform((value, ctx) => {
    if (value === '' || value === null || value === undefined) return null
    if (!/^\d+(\.\d+)?$/.test(value)) {
      ctx.addIssue({ code: 'custom', message: 'invalid_number' })
      return z.NEVER
    }
    return value
  })
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : '_root'
    if (!fields[key]) fields[key] = issue.message || 'invalid'
  }
  return fields
}

export function dateOrderIssue(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false
  return new Date(end).getTime() < new Date(start).getTime()
}
