import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role, company, phone, city, country } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'short_password' }, { status: 400 })
    }
    if (role === Role.ADMIN) {
      return NextResponse.json({ error: 'admin_registration_disabled' }, { status: 403 })
    }
    if (role !== Role.SEAFARER && role !== Role.RECRUITER) {
      return NextResponse.json({ error: 'invalid_role' }, { status: 400 })
    }
    if (role === 'RECRUITER' && !company) {
      return NextResponse.json({ error: 'company_required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'email_exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        name,
        role,
        company: company || null,
        phone: phone || null,
        city: city || null,
        country: country || null,
      },
    })

    if (user.role === Role.SEAFARER) {
      await db.seafarerProfile.create({ data: { userId: user.id } })
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
    console.error('register error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
