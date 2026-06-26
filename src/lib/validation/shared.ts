import { NextRequest, NextResponse } from 'next/server'
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

export function validationError(fields: Record<string, string> = {}) {
  return NextResponse.json({ error: 'validation_error', fields }, { status: 400 })
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : '_root'
    if (!fields[key]) fields[key] = issue.message || 'invalid'
  }
  return fields
}

export async function parseJsonBody(req: NextRequest): Promise<unknown | NextResponse> {
  try {
    return await req.json()
  } catch {
    return validationError({ _root: 'invalid_json' })
  }
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T | NextResponse {
  const parsed = schema.safeParse(body)
  if (!parsed.success) return validationError(zodFieldErrors(parsed.error))
  return parsed.data
}

export function dateOrderIssue(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false
  return new Date(end).getTime() < new Date(start).getTime()
}
