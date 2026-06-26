import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ApplicationStatus } from '@prisma/client'
import { applicationUpdateSchema } from '@/lib/validation/applications'
import { parseBody, parseJsonBody } from '@/lib/validation/shared'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(applicationUpdateSchema, body)
  if (parsed instanceof NextResponse) {
    const hasStatus = typeof body === 'object' && body !== null && 'status' in body
    if (hasStatus) return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    return parsed
  }

  const app = await db.application.findUnique({ where: { id }, include: { job: true } })
  if (!app || app.job.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const status = parsed.status as ApplicationStatus

  const updated = await db.application.update({ where: { id }, data: { status } })
  return NextResponse.json({ application: updated })
}
