import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null })
  }
  if (user.role === 'SEAFARER') {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      await db.seafarerProfile.create({ data: { userId: user.id } })
    }
  }
  return NextResponse.json({ user })
}
