import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  const seafarerId = new URL(req.url).searchParams.get('seafarerId')!
  await db.savedProfile.deleteMany({ where: { recruiterId: user.id, seafarerId } })
  return NextResponse.json({ ok: true })
}
