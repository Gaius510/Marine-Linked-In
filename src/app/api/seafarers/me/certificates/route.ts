import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { certificateSchema } from '@/lib/validation/seafarers'
import { parseBody, parseJsonBody } from '@/lib/validation/shared'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(certificateSchema, body)
  if (parsed instanceof NextResponse) return parsed
  const cert = await db.certificate.create({
    data: {
      seafarerId: profile.id,
      name: parsed.name,
      number: parsed.number,
      issuedDate: parsed.issuedDate,
      expiryDate: parsed.expiryDate,
      issuingAuthority: parsed.issuingAuthority,
    },
  })
  return NextResponse.json({ certificate: cert })
}
