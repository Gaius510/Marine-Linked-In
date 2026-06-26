import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Availability } from '@prisma/client'
import { seafarerProfileUpdateSchema } from '@/lib/validation/seafarers'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

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
      travelAuthorizations: { orderBy: { createdAt: 'desc' } },
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

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(seafarerProfileUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed
  const allowed = [
    'rank', 'nationality', 'dateOfBirth', 'availability', 'availableFrom', 'yearsExperience',
    'bio', 'cocGrade', 'cocExpiry', 'passportNo', 'passportExpiry', 'usVisa', 'schengenVisa',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in parsed) {
      data[key] = parsed[key as keyof typeof parsed]
    }
  }
  if (data.availability) {
    data.availability = data.availability as Availability
  }

  const profile = await db.seafarerProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data } as never,
  })

  // also update some user fields
  const userFields: Record<string, unknown> = {}
  if ('phone' in parsed) userFields.phone = parsed.phone
  if ('city' in parsed) userFields.city = parsed.city
  if ('country' in parsed) userFields.country = parsed.country
  if (Object.keys(userFields).length) {
    await db.user.update({ where: { id: user.id }, data: userFields })
  }

  return NextResponse.json({ profile })
}
