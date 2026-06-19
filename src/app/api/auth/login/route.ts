import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }

    await setSessionCookie(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        phone: user.phone,
        city: user.city,
        country: user.country,
      },
    })
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
