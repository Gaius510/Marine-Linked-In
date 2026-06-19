import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ApplicationStatus } from '@prisma/client'

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')!
  const body = await req.json()

  const app = await db.application.findUnique({ where: { id }, include: { job: true } })
  if (!app || app.job.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const status = body.status as ApplicationStatus
  if (!['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'].includes(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }

  const updated = await db.application.update({ where: { id }, data: { status } })
  return NextResponse.json({ application: updated })
}
