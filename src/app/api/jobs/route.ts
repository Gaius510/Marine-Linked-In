import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { jobCreateSchema } from '@/lib/validation/jobs'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === '1'

  const where: Prisma.JobWhereInput = {}
  if (mine && user?.role === 'RECRUITER') {
    where.recruiterId = user.id
  } else if (!mine) {
    where.status = 'OPEN'
  }

  const rank = searchParams.get('rank')
  const vesselType = searchParams.get('vesselType')
  const search = searchParams.get('search')
  if (rank) where.rank = rank
  if (vesselType) where.vesselType = vesselType
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { companyName: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const jobs = await db.job.findMany({
    where,
    include: {
      recruiter: { select: { id: true, name: true, company: true, email: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // attach seafarer's own application status
  let myApplications: Record<string, string> = {}
  if (user?.role === 'SEAFARER' && !mine) {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (profile) {
      const apps = await db.application.findMany({ where: { seafarerId: profile.id }, select: { jobId: true, status: true } })
      myApplications = Object.fromEntries(apps.map((a) => [a.jobId, a.status]))
    }
  }

  const result = jobs.map((j) => ({
    ...j,
    myApplicationStatus: myApplications[j.id] || null,
  }))

  return NextResponse.json({ jobs: result, total: result.length })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(jobCreateSchema, body)
  if (parsed instanceof NextResponse) {
    const hasTitle = typeof body === 'object' && body !== null && 'title' in body && typeof body.title === 'string' && body.title.trim()
    if (!hasTitle) return NextResponse.json({ error: 'missing_title' }, { status: 400 })
    return parsed
  }

  const job = await db.job.create({
    data: {
      recruiterId: user.id,
      title: parsed.title,
      rank: parsed.rank,
      vesselType: parsed.vesselType,
      companyName: parsed.companyName || user.company || 'Maritime Co',
      salaryMin: parsed.salaryMin,
      salaryMax: parsed.salaryMax,
      currency: parsed.currency,
      contractDuration: parsed.contractDuration,
      joiningDate: parsed.joiningDate,
      location: parsed.location,
      description: parsed.description,
      requirements: parsed.requirements,
    },
  })
  return NextResponse.json({ job })
}
