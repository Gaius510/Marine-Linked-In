import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { certificateUpdateSchema } from '@/lib/validation/seafarers'
import { dateOrderIssue } from '@/lib/validation/shared'
import { parseBody, parseJsonBody, validationError } from '@/lib/validation/server'

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
  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(certificateUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed
  const issuedDate = 'issuedDate' in parsed ? parsed.issuedDate : cert.issuedDate
  const expiryDate = 'expiryDate' in parsed ? parsed.expiryDate : cert.expiryDate
  if (dateOrderIssue(issuedDate, expiryDate)) {
    return validationError({ expiryDate: 'date_before_issue' })
  }
  const updated = await db.certificate.update({
    where: { id },
    data: {
      name: 'name' in parsed ? parsed.name : cert.name,
      number: 'number' in parsed ? parsed.number : cert.number,
      issuedDate,
      expiryDate,
      issuingAuthority: 'issuingAuthority' in parsed ? parsed.issuingAuthority : cert.issuingAuthority,
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
