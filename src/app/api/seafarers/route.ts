import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma, Availability } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const rank = searchParams.get('rank') || undefined
  const vesselType = searchParams.get('vesselType') || undefined
  const nationality = searchParams.get('nationality') || undefined
  const availability = searchParams.get('availability') || undefined
  const minYears = searchParams.get('minYears')
  const search = searchParams.get('search') || undefined

  const where: Prisma.SeafarerProfileWhereInput = {}
  if (rank) where.rank = rank
  if (nationality) where.nationality = nationality
  if (availability) where.availability = availability as Availability
  if (vesselType) {
    where.vesselExperiences = { some: { vesselType } }
  }
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
  }

  const profiles = await db.seafarerProfile.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true, role: true, company: true, phone: true, city: true, country: true } },
      vesselExperiences: true,
      _count: { select: { savedBy: true, applications: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Mark which are saved by the current recruiter
  let savedIds = new Set<string>()
  if (user.role === 'RECRUITER') {
    const saved = await db.savedProfile.findMany({ where: { recruiterId: user.id }, select: { seafarerId: true } })
    savedIds = new Set(saved.map((s) => s.seafarerId))
  }

  const minYearsNumber = minYears && !isNaN(parseInt(minYears, 10)) ? parseInt(minYears, 10) : null
  const filteredProfiles = minYearsNumber === null
    ? profiles
    : profiles.filter((p) => {
        const years = parseFloat(p.yearsExperience || '0')
        return Number.isFinite(years) && years >= minYearsNumber
      })

  const result = filteredProfiles.map((p) => ({
    ...p,
    availability: p.availability,
    savedByMe: savedIds.has(p.id),
  }))

  return NextResponse.json({ seafarers: result, total: result.length })
}
