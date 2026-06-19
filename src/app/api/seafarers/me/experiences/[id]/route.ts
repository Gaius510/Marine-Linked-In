import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

async function getOwnedExperience(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') return { error: NextResponse.json({ error: 'unauthorized' }, { status: 403 }) }
  const id = new URL(req.url).searchParams.get('id')!
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return { error: NextResponse.json({ error: 'no_profile' }, { status: 404 }) }
  const exp = await db.vesselExperience.findUnique({ where: { id } })
  if (!exp || exp.seafarerId !== profile.id) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) }
  return { profile, exp, id }
}

export async function PUT(req: NextRequest) {
  const res = await getOwnedExperience(req)
  if ('error' in res) return res.error
  const { exp, id } = res
  const body = await req.json()
  const updated = await db.vesselExperience.update({
    where: { id },
    data: {
      rank: body.rank ?? exp.rank,
      vesselType: body.vesselType ?? exp.vesselType,
      vesselName: body.vesselName ?? exp.vesselName,
      companyName: body.companyName ?? exp.companyName,
      imoNumber: body.imoNumber ?? exp.imoNumber,
      grossTonnage: body.grossTonnage ?? exp.grossTonnage,
      engineType: body.engineType ?? exp.engineType,
      tradeArea: body.tradeArea ?? exp.tradeArea,
      signOnDate: body.signOnDate ?? exp.signOnDate,
      signOffDate: body.signOffDate ?? exp.signOffDate,
      captainName: body.captainName ?? exp.captainName,
      captainContact: body.captainContact ?? exp.captainContact,
      chiefEngName: body.chiefEngName ?? exp.chiefEngName,
      chiefEngContact: body.chiefEngContact ?? exp.chiefEngContact,
    },
  })
  return NextResponse.json({ experience: updated })
}

export async function DELETE(req: NextRequest) {
  const res = await getOwnedExperience(req)
  if ('error' in res) return res.error
  await db.vesselExperience.delete({ where: { id: res.id } })
  return NextResponse.json({ ok: true })
}
