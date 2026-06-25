import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { InterviewStatus } from '@prisma/client'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const body = await req.json()

  const interview = await db.interview.findUnique({ where: { id } })
  if (!interview || interview.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const status = body.status as InterviewStatus
  if (!['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }
  const updated = await db.interview.update({ where: { id }, data: { status } })
  return NextResponse.json({ interview: updated })
}
