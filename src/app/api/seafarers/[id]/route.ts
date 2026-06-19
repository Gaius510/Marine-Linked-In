import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const profile = await db.seafarerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, company: true, phone: true, city: true, country: true } },
      certificates: { orderBy: { createdAt: 'desc' } },
      vesselExperiences: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let savedByMe = false
  if (user.role === 'RECRUITER') {
    const saved = await db.savedProfile.findUnique({ where: { recruiterId_seafarerId: { recruiterId: user.id, seafarerId: id } } })
    savedByMe = !!saved
  }
  return NextResponse.json({ profile, savedByMe })
}
