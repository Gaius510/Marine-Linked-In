import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET saved profiles for current recruiter
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const saved = await db.savedProfile.findMany({
    where: { recruiterId: user.id },
    include: {
      seafarer: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, city: true, country: true } },
          vesselExperiences: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ saved })
}

// POST: save one or many seafarers (bulk)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const body = await req.json()
  const seafarerIds: string[] = Array.isArray(body.seafarerIds) ? body.seafarerIds : [body.seafarerId].filter(Boolean)
  if (!seafarerIds.length) return NextResponse.json({ error: 'missing_seafarer' }, { status: 400 })

  const created = await db.$transaction(
    seafarerIds.map((sid) =>
      db.savedProfile.upsert({
        where: { recruiterId_seafarerId: { recruiterId: user.id, seafarerId: sid } },
        update: {},
        create: { recruiterId: user.id, seafarerId: sid },
      })
    )
  )
  return NextResponse.json({ count: created.length })
}
