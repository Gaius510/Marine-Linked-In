import { timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'
import { getSessionSecret } from './session-secret.mjs'

export { hashPassword, verifyPassword } from './password'

const COOKIE_NAME = 'maritime_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`
  const sig = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string): { userId: string; issuedAt: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const userId = parts[0]
  const issuedAt = parseInt(parts[1], 10)
  const sig = parts[2]
  const payload = `${userId}.${issuedAt}`
  const expectedSig = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  if (sig.length !== expectedSig.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
  const age = Math.floor(Date.now() / 1000) - issuedAt
  if (age > SESSION_MAX_AGE) return null
  return { userId, issuedAt }
}

export async function setSessionCookie(userId: string) {
  const token = createSessionToken(userId)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

export async function getCurrentUser() {
  const token = await getSessionCookie()
  if (!token) return null
  const session = verifySessionToken(token)
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      company: true,
      phone: true,
      city: true,
      country: true,
    },
  })
  return user
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUser>>
