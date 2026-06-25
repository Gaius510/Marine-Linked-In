import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production')
  }
  return 'maritime-network-dev-secret-change-me'
}

const SESSION_SECRET = getSessionSecret()
const COOKIE_NAME = 'maritime_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string): { userId: string; issuedAt: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const userId = parts[0]
  const issuedAt = parseInt(parts[1], 10)
  const sig = parts[2]
  const payload = `${userId}.${issuedAt}`
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
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
