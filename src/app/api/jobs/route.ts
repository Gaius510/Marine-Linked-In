import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'missing_title' }, { status: 400 })

  const job = await db.job.create({
    data: {
      recruiterId: user.id,
      title: body.title,
      rank: body.rank || null,
      vesselType: body.vesselType || null,
      companyName: body.companyName || user.company || 'Maritime Co',
      salaryMin: body.salaryMin || null,
      salaryMax: body.salaryMax || null,
      currency: body.currency || 'USD',
      contractDuration: body.contractDuration || null,
      joiningDate: body.joiningDate || null,
      location: body.location || null,
      description: body.description || null,
      requirements: body.requirements || null,
    },
  })
  return NextResponse.json({ job })
}
