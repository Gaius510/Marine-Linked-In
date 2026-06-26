import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { travelAuthorizationUpdateSchema } from '@/lib/validation/travel-authorizations'
import { parseBody, parseJsonBody, validationError } from '@/lib/validation/server'

type RouteContext = { params: Promise<{ id: string }> }

async function getOwnedAuthorization(userId: string, id: string) {
  return db.travelAuthorization.findFirst({
    where: {
      id,
      seafarer: { userId },
    },
  })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const { id } = await params
  if (!id?.trim()) return validationError({ id: 'required' })

  const existing = await getOwnedAuthorization(user.id, id)
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const bodyObject = typeof body === 'object' && body !== null ? body : {}
  const parsed = parseBody(travelAuthorizationUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const nextType = parsed.type ?? existing.type
  const data: {
    type?: typeof existing.type
    customType?: string | null
    countryCode?: string | null
    documentNumber?: string | null
    issuedAt?: Date | null
    expiresAt?: Date | null
    notes?: string | null
  } = {}

  if (Object.hasOwn(bodyObject, 'type') && parsed.type) data.type = parsed.type
  if (Object.hasOwn(bodyObject, 'customType') || Object.hasOwn(bodyObject, 'type')) {
    data.customType = nextType === 'OTHER' ? parsed.customType ?? existing.customType : null
  }
  if (Object.hasOwn(bodyObject, 'countryCode')) data.countryCode = parsed.countryCode
  if (Object.hasOwn(bodyObject, 'documentNumber')) data.documentNumber = parsed.documentNumber
  if (Object.hasOwn(bodyObject, 'issuedAt')) data.issuedAt = parsed.issuedAt
  if (Object.hasOwn(bodyObject, 'expiresAt')) data.expiresAt = parsed.expiresAt
  if (Object.hasOwn(bodyObject, 'notes')) data.notes = parsed.notes

  if (Object.keys(data).length === 0) return validationError({ _root: 'required' })

  const travelAuthorization = await db.travelAuthorization.update({
    where: { id },
    data,
  })

  return NextResponse.json({ travelAuthorization })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEAFARER') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const { id } = await params
  if (!id?.trim()) return validationError({ id: 'required' })

  const existing = await getOwnedAuthorization(user.id, id)
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.travelAuthorization.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
