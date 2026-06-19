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
  const cert = await db.certificate.create({
    data: {
      seafarerId: profile.id,
      name: body.name || 'Certificate',
      number: body.number || null,
      issuedDate: body.issuedDate || null,
      expiryDate: body.expiryDate || null,
      issuingAuthority: body.issuingAuthority || null,
    },
  })
  return NextResponse.json({ certificate: cert })
}
