import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Availability } from '@prisma/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const profile = await db.seafarerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, company: true, phone: true, city: true, country: true } },
      certificates: { orderBy: { createdAt: 'desc' } },
      vesselExperiences: { orderBy: { createdAt: 'desc' } },
      applications: {
        include: { job: { include: { recruiter: { select: { id: true, name: true, company: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json({ profile })
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = [
    'rank', 'nationality', 'dateOfBirth', 'availability', 'availableFrom', 'yearsExperience',
    'bio', 'cocGrade', 'cocExpiry', 'passportNo', 'passportExpiry', 'usVisa', 'schengenVisa',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key] === '' ? null : body[key]
    }
  }
  if (data.availability && !['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE'].includes(data.availability as string)) {
    delete data.availability
  } else if (data.availability) {
    data.availability = data.availability as Availability
  }

  const profile = await db.seafarerProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data } as never,
  })

  // also update some user fields
  const userFields: Record<string, unknown> = {}
  if ('phone' in body) userFields.phone = body.phone || null
  if ('city' in body) userFields.city = body.city || null
  if ('country' in body) userFields.country = body.country || null
  if (Object.keys(userFields).length) {
    await db.user.update({ where: { id: user.id }, data: userFields })
  }

  return NextResponse.json({ profile })
}
