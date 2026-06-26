import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { InterviewStatus } from '@prisma/client'
import { interviewUpdateSchema } from '@/lib/validation/interviews'
import { parseBody, parseJsonBody } from '@/lib/validation/shared'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(interviewUpdateSchema, body)
  if (parsed instanceof NextResponse) {
    const hasStatus = typeof body === 'object' && body !== null && 'status' in body
    if (hasStatus) return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    return parsed
  }

  const interview = await db.interview.findUnique({ where: { id } })
  if (!interview || interview.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const status = parsed.status as InterviewStatus
  const updated = await db.interview.update({ where: { id }, data: { status } })
  return NextResponse.json({ interview: updated })
}
