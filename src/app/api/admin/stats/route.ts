import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Availability } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const rank = searchParams.get('rank') || undefined
  const vesselType = searchParams.get('vesselType') || undefined
  const nationality = searchParams.get('nationality') || undefined
  const availability = searchParams.get('availability') || undefined
  const minYears = searchParams.get('minYears')
  const search = searchParams.get('search') || undefined
  const role = searchParams.get('role') // 'SEAFARER' | 'RECRUITER' | undefined (all users)

  // If role=RECRUITER or not specified as seafarer, also list users
  const where: Prisma.SeafarerProfileWhereInput = {}
  if (rank) where.rank = rank
  if (nationality) where.nationality = nationality
  if (availability) where.availability = availability as Availability
  if (vesselType) where.vesselExperiences = { some: { vesselType } }
  if (search) {
    where.user = { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
  }

  const [seafarers, totalSeafarers, totalRecruiters, totalJobs, totalApplications, availableNow, onBoard, allUsers] = await Promise.all([
    db.seafarerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, company: true, phone: true, city: true, country: true, createdAt: true } },
        certificates: { orderBy: { createdAt: 'desc' } },
        vesselExperiences: true,
        travelAuthorizations: {
          select: { id: true, type: true, customType: true, countryCode: true, expiresAt: true, verificationStatus: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { savedBy: true, applications: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    }),
    db.seafarerProfile.count(),
    db.user.count({ where: { role: 'RECRUITER' } }),
    db.job.count({ where: { status: 'OPEN' } }),
    db.application.count(),
    db.seafarerProfile.count({ where: { availability: 'AVAILABLE' } }),
    db.seafarerProfile.count({ where: { availability: 'ON_BOARD' } }),
    db.user.findMany({
      where: role ? { role: role as 'SEAFARER' | 'RECRUITER' | 'ADMIN' } : undefined,
      select: { id: true, name: true, email: true, role: true, company: true, phone: true, city: true, country: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const minYearsNumber = minYears && !isNaN(parseInt(minYears, 10)) ? parseInt(minYears, 10) : null
  const filteredSeafarers = minYearsNumber === null
    ? seafarers
    : seafarers.filter((p) => {
        const years = parseFloat(p.yearsExperience || '0')
        return Number.isFinite(years) && years >= minYearsNumber
      })

  return NextResponse.json({
    seafarers: filteredSeafarers,
    allUsers,
    stats: {
      totalSeafarers,
      totalRecruiters,
      totalJobs,
      totalApplications,
      availableNow,
      onBoard,
    },
    total: filteredSeafarers.length,
  })
}
