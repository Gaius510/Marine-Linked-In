import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ seafarerId: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const { seafarerId } = await params
  await db.savedProfile.deleteMany({ where: { recruiterId: user.id, seafarerId } })
  return NextResponse.json({ ok: true })
}
