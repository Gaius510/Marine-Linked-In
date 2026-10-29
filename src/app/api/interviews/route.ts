import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeSeafarerForCandidateAccess } from '@/lib/privacy'
import { interviewCreateSchema } from '@/lib/validation/interviews'
import { parseBody, parseJsonBody } from '@/lib/validation/server'
import { Prisma } from '@prisma/client'

// GET interviews - recruiter sees theirs, seafarer sees theirs
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  if (user.role === 'RECRUITER') {
    const interviews = await db.interview.findMany({
      where: { recruiterId: user.id },
      include: {
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
        job: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return NextResponse.json({
      // Suppress foreign job content in legacy associations without editing data.
      interviews: interviews.map((interview) => ({
        id: interview.id,
        recruiterId: interview.recruiterId,
        seafarerId: interview.seafarerId,
        jobId: interview.jobId,
        scheduledAt: interview.scheduledAt,
        location: interview.location,
        notes: interview.notes,
        status: interview.status,
        createdAt: interview.createdAt,
        job: interview.job?.recruiterId === interview.recruiterId ? interview.job : null,
        seafarer: sanitizeSeafarerForCandidateAccess(interview.seafarer),
      })),
    })
  }
  if (user.role === 'SEAFARER') {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ interviews: [] })
    const interviews = await db.interview.findMany({
      where: { seafarerId: profile.id },
      include: {
        recruiter: { select: { id: true, name: true, company: true } },
        job: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return NextResponse.json({
      interviews: interviews.map((interview) => ({
        id: interview.id,
        recruiterId: interview.recruiterId,
        seafarerId: interview.seafarerId,
        jobId: interview.jobId,
        scheduledAt: interview.scheduledAt,
        location: interview.location,
        notes: null,
        status: interview.status,
        createdAt: interview.createdAt,
        recruiter: interview.recruiter,
        job: interview.job?.recruiterId === interview.recruiterId ? interview.job : null,
      })),
    })
  }
  return NextResponse.json({ interviews: [] })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: user ? 403 : 401 })

    const body = await parseJsonBody(req)
    if (body instanceof NextResponse) return body
    const parsed = parseBody(interviewCreateSchema, body)
    if (parsed instanceof NextResponse) {
      const hasRequired = typeof body === 'object' && body !== null && 'seafarerId' in body && 'scheduledAt' in body && body.seafarerId && body.scheduledAt
      if (!hasRequired) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
      return parsed
    }
    const { seafarerId, jobId, scheduledAt, location, notes } = parsed

    return await db.$transaction(async (tx) => {
      if (jobId) {
        // Unknown and foreign jobs share a 404; do not reveal their details.
        // An owner's CLOSED jobs remain usable for ongoing recruitment.
        const job = await tx.job.findFirst({ where: { id: jobId, recruiterId: user.id }, select: { id: true } })
        if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }
      const seafarer = await tx.seafarerProfile.findUnique({ where: { id: seafarerId }, select: { id: true } })
      if (!seafarer) return NextResponse.json({ error: 'not_found' }, { status: 404 })

      const interview = await tx.interview.create({
        data: { recruiterId: user.id, seafarerId, jobId, scheduledAt, location, notes },
      })
      return NextResponse.json({ interview })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' || error.code === 'P2025') return NextResponse.json({ error: 'not_found' }, { status: 404 })
      if (error.code === 'P2034') return NextResponse.json({ error: 'request_conflict' }, { status: 409 })
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
