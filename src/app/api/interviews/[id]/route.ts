import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { InterviewStatus } from '@prisma/client'
import { interviewUpdateSchema } from '@/lib/validation/interviews'
import { parseBody, parseJsonBody, validationError } from '@/lib/validation/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const bodyObject = typeof body === 'object' && body !== null ? body : {}
  const parsed = parseBody(interviewUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const interview = await db.interview.findUnique({ where: { id } })
  if (!interview || interview.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const data: {
    status?: InterviewStatus
    scheduledAt?: string
    location?: string | null
    notes?: string | null
  } = {}

  if (parsed.status) data.status = parsed.status as InterviewStatus
  if (Object.hasOwn(bodyObject, 'scheduledAt') && parsed.scheduledAt) data.scheduledAt = parsed.scheduledAt
  if (Object.hasOwn(bodyObject, 'location')) data.location = parsed.location
  if (Object.hasOwn(bodyObject, 'notes')) data.notes = parsed.notes

  if (Object.keys(data).length === 0) return validationError({ _root: 'required' })

  const updated = await db.interview.update({ where: { id }, data })
  return NextResponse.json({ interview: updated })
}
