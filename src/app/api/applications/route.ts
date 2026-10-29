import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeSeafarerForCandidateAccess } from '@/lib/privacy'
import { applicationCreateSchema } from '@/lib/validation/applications'
import { parseBody, parseJsonBody } from '@/lib/validation/server'
import { Prisma } from '@prisma/client'

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
        job: { include: { recruiter: { select: { id: true, name: true, company: true } } } },
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
            user: { select: { id: true, name: true, city: true, country: true } },
            certificates: { orderBy: { createdAt: 'desc' } },
            vesselExperiences: true,
            travelAuthorizations: {
              select: { id: true, type: true, customType: true, countryCode: true, expiresAt: true, verificationStatus: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      applications: applications.map((application) => ({
        id: application.id,
        jobId: application.jobId,
        seafarerId: application.seafarerId,
        status: application.status,
        message: application.message,
        coverLetter: application.coverLetter,
        createdAt: application.createdAt,
        job: application.job,
        seafarer: sanitizeSeafarerForCandidateAccess(application.seafarer),
      })),
    })
  }

  return NextResponse.json({ applications: [] })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SEAFARER') return NextResponse.json({ error: 'unauthorized' }, { status: user ? 403 : 401 })

    const body = await parseJsonBody(req)
    if (body instanceof NextResponse) return body
    const parsed = parseBody(applicationCreateSchema, body)
    if (parsed instanceof NextResponse) {
      const hasJob = typeof body === 'object' && body !== null && 'jobId' in body && body.jobId
      if (!hasJob) return NextResponse.json({ error: 'missing_job' }, { status: 400 })
      return parsed
    }
    const { jobId, message } = parsed

    // Keep eligibility and insertion in the same SQLite transaction so a job
    // closure cannot commit between the OPEN check and application creation.
    return await db.$transaction(async (tx) => {
      const profile = await tx.seafarerProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
      if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

      const job = await tx.job.findFirst({ where: { id: jobId, status: 'OPEN' }, select: { id: true } })
      if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 })

      const existing = await tx.application.findUnique({
        where: { jobId_seafarerId: { jobId, seafarerId: profile.id } },
        select: { id: true },
      })
      if (existing) return NextResponse.json({ error: 'already_applied' }, { status: 409 })

      const application = await tx.application.create({ data: { jobId, seafarerId: profile.id, message } })
      return NextResponse.json({ application })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return NextResponse.json({ error: 'already_applied' }, { status: 409 })
      if (error.code === 'P2003' || error.code === 'P2025') return NextResponse.json({ error: 'not_found' }, { status: 404 })
      if (error.code === 'P2034') return NextResponse.json({ error: 'request_conflict' }, { status: 409 })
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
