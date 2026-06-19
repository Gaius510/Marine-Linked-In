import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET interviews - recruiter sees theirs, seafarer sees theirs
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  if (user.role === 'RECRUITER') {
    const interviews = await db.interview.findMany({
      where: { recruiterId: user.id },
      include: {
        seafarer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        job: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return NextResponse.json({ interviews })
  }
  if (user.role === 'SEAFARER') {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ interviews: [] })
    const interviews = await db.interview.findMany({
      where: { seafarerId: profile.id },
      include: {
        recruiter: { select: { id: true, name: true, company: true, email: true } },
        job: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return NextResponse.json({ interviews })
  }
  return NextResponse.json({ interviews: [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const body = await req.json()
  const { seafarerId, jobId, scheduledAt, location, notes } = body
  if (!seafarerId || !scheduledAt) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const interview = await db.interview.create({
    data: {
      recruiterId: user.id,
      seafarerId,
      jobId: jobId || null,
      scheduledAt,
      location: location || null,
      notes: notes || null,
    },
  })
  return NextResponse.json({ interview })
}
