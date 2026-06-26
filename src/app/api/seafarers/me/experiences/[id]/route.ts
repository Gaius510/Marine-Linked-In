import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { experienceUpdateSchema } from '@/lib/validation/seafarers'
import { dateOrderIssue, parseBody, parseJsonBody, validationError } from '@/lib/validation/shared'

type RouteContext = { params: Promise<{ id: string }> }

async function getOwnedExperience(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') return { error: NextResponse.json({ error: 'unauthorized' }, { status: 403 }) }
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return { error: NextResponse.json({ error: 'no_profile' }, { status: 404 }) }
  const exp = await db.vesselExperience.findUnique({ where: { id } })
  if (!exp || exp.seafarerId !== profile.id) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) }
  return { profile, exp, id }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const res = await getOwnedExperience(id)
  if ('error' in res) return res.error
  const { exp } = res
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(experienceUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed
  const signOnDate = 'signOnDate' in parsed ? parsed.signOnDate : exp.signOnDate
  const signOffDate = 'signOffDate' in parsed ? parsed.signOffDate : exp.signOffDate
  if (dateOrderIssue(signOnDate, signOffDate)) {
    return validationError({ signOffDate: 'date_before_start' })
  }
  const updated = await db.vesselExperience.update({
    where: { id },
    data: {
      rank: 'rank' in parsed ? parsed.rank : exp.rank,
      vesselType: 'vesselType' in parsed ? parsed.vesselType : exp.vesselType,
      vesselName: 'vesselName' in parsed ? parsed.vesselName : exp.vesselName,
      companyName: 'companyName' in parsed ? parsed.companyName : exp.companyName,
      imoNumber: 'imoNumber' in parsed ? parsed.imoNumber : exp.imoNumber,
      grossTonnage: 'grossTonnage' in parsed ? parsed.grossTonnage : exp.grossTonnage,
      engineType: 'engineType' in parsed ? parsed.engineType : exp.engineType,
      tradeArea: 'tradeArea' in parsed ? parsed.tradeArea : exp.tradeArea,
      signOnDate,
      signOffDate,
      captainName: 'captainName' in parsed ? parsed.captainName : exp.captainName,
      captainContact: 'captainContact' in parsed ? parsed.captainContact : exp.captainContact,
      chiefEngName: 'chiefEngName' in parsed ? parsed.chiefEngName : exp.chiefEngName,
      chiefEngContact: 'chiefEngContact' in parsed ? parsed.chiefEngContact : exp.chiefEngContact,
    },
  })
  return NextResponse.json({ experience: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const res = await getOwnedExperience(id)
  if ('error' in res) return res.error
  await db.vesselExperience.delete({ where: { id: res.id } })
  return NextResponse.json({ ok: true })
}
