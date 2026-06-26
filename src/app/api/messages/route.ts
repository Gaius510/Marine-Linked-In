import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { messageCreateSchema } from '@/lib/validation/messages'
import { parseBody, parseJsonBody } from '@/lib/validation/server'

// GET: messages - recruiter sees sent, seafarer sees received
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  if (user.role === 'RECRUITER') {
    const messages = await db.message.findMany({
      where: { recruiterId: user.id },
      include: {
        seafarer: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ messages })
  }
  if (user.role === 'SEAFARER') {
    const profile = await db.seafarerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ messages: [] })
    const messages = await db.message.findMany({
      where: { seafarerId: profile.id },
      include: { recruiter: { select: { id: true, name: true, company: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ messages })
  }
  return NextResponse.json({ messages: [] })
}

// POST: send message to one or many seafarers (bulk)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'RECRUITER') return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const body = await parseJsonBody(req)
  if (body instanceof NextResponse) return body
  const parsed = parseBody(messageCreateSchema, body)
  if (parsed instanceof NextResponse) {
    const hasBody = typeof body === 'object' && body !== null && 'body' in body && body.body
    if (!hasBody) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    return parsed
  }

  const created = await db.$transaction(
    parsed.seafarerIds.map((sid) =>
      db.message.create({ data: { recruiterId: user.id, seafarerId: sid, subject: parsed.subject, body: parsed.body } })
    )
  )
  return NextResponse.json({ count: created.length })
}
