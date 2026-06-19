import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const body = await req.json()
  const exp = await db.vesselExperience.create({
    data: {
      seafarerId: profile.id,
      rank: body.rank || null,
      vesselType: body.vesselType || 'General Cargo',
      vesselName: body.vesselName || null,
      companyName: body.companyName || null,
      imoNumber: body.imoNumber || null,
      grossTonnage: body.grossTonnage || null,
      engineType: body.engineType || null,
      tradeArea: body.tradeArea || null,
      signOnDate: body.signOnDate || null,
      signOffDate: body.signOffDate || null,
      captainName: body.captainName || null,
      captainContact: body.captainContact || null,
      chiefEngName: body.chiefEngName || null,
      chiefEngContact: body.chiefEngContact || null,
    },
  })
  return NextResponse.json({ experience: exp })
}
