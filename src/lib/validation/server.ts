import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { zodFieldErrors } from './shared'

export function validationError(fields: Record<string, string> = {}) {
  return NextResponse.json({ error: 'validation_error', fields }, { status: 400 })
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
