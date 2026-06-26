import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import { Role } from '@prisma/client'
import { registerSchema } from '@/lib/validation/auth'
import { parseBody, parseJsonBody } from '@/lib/validation/shared'

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req)
    if (body instanceof NextResponse) return body

    if (typeof body === 'object' && body !== null && 'role' in body && body.role === Role.ADMIN) {
      return NextResponse.json({ error: 'admin_registration_disabled' }, { status: 403 })
    }

    const parsed = parseBody(registerSchema, body)
    if (parsed instanceof NextResponse) {
      const hasRequiredFields = typeof body === 'object' && body !== null && 'email' in body && 'password' in body && 'name' in body && 'role' in body
      if (!hasRequiredFields) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
      if (typeof body === 'object' && body !== null && 'password' in body && typeof body.password === 'string' && body.password.length < 6) {
        return NextResponse.json({ error: 'short_password' }, { status: 400 })
      }
      if (typeof body === 'object' && body !== null && 'role' in body && body.role !== Role.SEAFARER && body.role !== Role.RECRUITER) {
        return NextResponse.json({ error: 'invalid_role' }, { status: 400 })
      }
      if (typeof body === 'object' && body !== null && body.role === Role.RECRUITER && (!('company' in body) || !body.company)) {
        return NextResponse.json({ error: 'company_required' }, { status: 400 })
      }
      return parsed
    }
    const { email, password, name, role, company, phone, city, country } = parsed

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'email_exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        email,
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
