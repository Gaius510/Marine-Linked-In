import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { experienceSchema } from '@/lib/validation/seafarers'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(experienceSchema, body)
  if (parsed instanceof NextResponse) return parsed
  const exp = await db.vesselExperience.create({
    data: {
      seafarerId: profile.id,
      rank: parsed.rank,
      vesselType: parsed.vesselType,
      vesselName: parsed.vesselName,
      companyName: parsed.companyName,
      imoNumber: parsed.imoNumber,
      grossTonnage: parsed.grossTonnage,
      engineType: parsed.engineType,
      tradeArea: parsed.tradeArea,
      signOnDate: parsed.signOnDate,
      signOffDate: parsed.signOffDate,
      captainName: parsed.captainName,
      captainContact: parsed.captainContact,
      chiefEngName: parsed.chiefEngName,
      chiefEngContact: parsed.chiefEngContact,
    },
  })
  return NextResponse.json({ experience: exp })
}
