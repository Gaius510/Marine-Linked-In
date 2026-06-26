import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { applicationCreateSchema } from '@/lib/validation/applications'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

// GET applications: recruiter sees apps for their jobs; seafarer sees their apps
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (user.role === 'SEAFARER') {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ applications: [] })
    const applications = await db.application.findMany({
      where: { seafarerId: profile.id, ...(jobId ? { jobId } : {}) },
      include: {
        job: { include: { recruiter: { select: { id: true, name: true, company: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ applications })
  }

  if (user.role === 'RECRUITER') {
    const applications = await db.application.findMany({
      where: { job: { recruiterId: user.id }, ...(jobId ? { jobId } : {}) },
      include: {
        job: true,
        seafarer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, city: true, country: true } },
            vesselExperiences: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ applications })
  }

  return NextResponse.json({ applications: [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(applicationCreateSchema, body)
  if (parsed instanceof NextResponse) {
    const hasJob = typeof body === 'object' && body !== null && 'jobId' in body && body.jobId
    if (!hasJob) return NextResponse.json({ error: 'missing_job' }, { status: 400 })
    return parsed
  }
  const { jobId, message } = parsed

  // prevent duplicate
  const existing = await db.application.findUnique({
    where: { jobId_seafarerId: { jobId, seafarerId: profile.id } },
  })
  if (existing) return NextResponse.json({ error: 'already_applied', application: existing }, { status: 409 })

  const application = await db.application.create({
    data: { jobId, seafarerId: profile.id, message },
  })
  return NextResponse.json({ application })
}
