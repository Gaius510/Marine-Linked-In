import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { JobStatus } from '@prisma/client'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const job = await db.job.findUnique({
    where: { id },
    include: {
      recruiter: { select: { id: true, name: true, company: true, email: true, phone: true } },
      _count: { select: { applications: true } },
    },
  })
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ job })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job || job.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const k of ['title', 'rank', 'vesselType', 'companyName', 'salaryMin', 'salaryMax', 'currency', 'contractDuration', 'joiningDate', 'location', 'description', 'requirements']) {
    if (k in body) data[k] = body[k] === '' ? null : body[k]
  }
  if (body.status && ['OPEN', 'CLOSED'].includes(body.status)) data.status = body.status as JobStatus

  const updated = await db.job.update({ where: { id }, data })
  return NextResponse.json({ job: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job || job.recruiterId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.job.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
