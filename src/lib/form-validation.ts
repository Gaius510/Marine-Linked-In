import { z } from 'zod'
import { ApiError } from '@/lib/api'

export type FieldErrors = Record<string, string>
export type Translate = (key: string, vars?: Record<string, string | number>) => string

export function zodErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : '_root'
    if (!fields[key]) fields[key] = issue.message || 'invalid'
  }
  return fields
}

export function validateFields<T>(schema: z.ZodType<T>, payload: unknown): { data: T; errors: null } | { data: null; errors: FieldErrors } {
  const parsed = schema.safeParse(payload)
  if (parsed.success) return { data: parsed.data, errors: null }
  return { data: null, errors: zodErrors(parsed.error) }
}

export function apiFieldErrors(error: unknown): FieldErrors | null {
  return error instanceof ApiError && error.message === 'validation_error' && error.fields ? error.fields : null
}

export function translateFieldError(t: Translate, code: string): string {
  return t(`validation.${code}`)
}

export function focusFirstInvalid(errors: FieldErrors, fieldIds: Record<string, string>) {
  const firstKey = Object.keys(errors).find((key) => fieldIds[key])
  if (!firstKey) return
  window.requestAnimationFrame(() => {
    document.getElementById(fieldIds[firstKey])?.focus()
  })
}
