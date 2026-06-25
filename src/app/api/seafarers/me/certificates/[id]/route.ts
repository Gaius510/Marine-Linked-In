import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

async function getOwnedCert(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') return { error: NextResponse.json({ error: 'unauthorized' }, { status: 403 }) }
  const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return { error: NextResponse.json({ error: 'no_profile' }, { status: 404 }) }
  const cert = await db.certificate.findUnique({ where: { id } })
  if (!cert || cert.seafarerId !== profile.id) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) }
  return { cert, id }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const res = await getOwnedCert(id)
  if ('error' in res) return res.error
  const { cert } = res
  const body = await req.json()
  const updated = await db.certificate.update({
    where: { id },
    data: {
      name: body.name ?? cert.name,
      number: body.number ?? cert.number,
      issuedDate: body.issuedDate ?? cert.issuedDate,
      expiryDate: body.expiryDate ?? cert.expiryDate,
      issuingAuthority: body.issuingAuthority ?? cert.issuingAuthority,
    },
  })
  return NextResponse.json({ certificate: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const res = await getOwnedCert(id)
  if ('error' in res) return res.error
  await db.certificate.delete({ where: { id: res.id } })
  return NextResponse.json({ ok: true })
}
