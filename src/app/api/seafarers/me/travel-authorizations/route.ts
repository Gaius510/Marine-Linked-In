import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { travelAuthorizationCreateSchema } from '@/lib/validation/travel-authorizations'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const profile = await db.seafarerProfile.findUnique({
    where: { userId: user.id },
    select: {
      travelAuthorizations: { orderBy: { createdAt: 'desc' } },
    },
  })

  return NextResponse.json({ travelAuthorizations: profile?.travelAuthorizations ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(travelAuthorizationCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const travelAuthorization = await db.travelAuthorization.create({
    data: {
      seafarerId: profile.id,
      type: parsed.type,
      customType: parsed.type === 'OTHER' ? parsed.customType : null,
      countryCode: parsed.countryCode,
      documentNumber: parsed.documentNumber,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
      notes: parsed.notes,
    },
  })

  return NextResponse.json({ travelAuthorization })
}
