import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MARKDOWN_EMAIL_PATTERN = /^\s*\[[^\]]+\]\(\s*mailto:[^)]+\)\s*$/i
const WEAK_PASSWORD_PATTERNS = [
  /^admin(?:\d+)?$/i,
  /^password(?:\d+)?$/i,
  /^change[-_ ]?me$/i,
]

interface AdminInput {
  email: string
  password: string
  name?: string
}

function fail(message: string): never {
  console.error(`Admin creation failed: ${message}`)
  process.exit(1)
}

function readAdminInput(): AdminInput {
  if (process.env.NODE_ENV === 'production') {
    fail('this local development command is disabled in production')
  }

  const rawEmail = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || undefined

  if (!rawEmail) fail('ADMIN_EMAIL is required')
  if (MARKDOWN_EMAIL_PATTERN.test(rawEmail) || /mailto:/i.test(rawEmail)) {
    fail('ADMIN_EMAIL must be a plain email address, not Markdown or a mailto link')
  }
  if (!EMAIL_PATTERN.test(rawEmail)) fail('ADMIN_EMAIL must be a valid email address')
  if (!password || password.trim().length === 0) fail('ADMIN_PASSWORD is required')
  if (password.length < 12) fail('ADMIN_PASSWORD must be at least 12 characters')
  if (WEAK_PASSWORD_PATTERNS.some((pattern) => pattern.test(password.trim()))) {
    fail('ADMIN_PASSWORD is too common')
  }

  return { email: rawEmail.toLowerCase(), password, name }
}

async function main() {
  const input = readAdminInput()
  const db = new PrismaClient()

  try {
    const existing = await db.user.findUnique({ where: { email: input.email } })
    const passwordHash = hashPassword(input.password)

    if (existing) {
      await db.user.update({
        where: { email: input.email },
        data: {
          role: Role.ADMIN,
          passwordHash,
          ...(input.name ? { name: input.name } : {}),
        },
      })
      console.log(`Admin account updated: ${input.email}`)
      return
    }

    await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name ?? 'Local Admin',
        role: Role.ADMIN,
      },
    })
    console.log(`Admin account created: ${input.email}`)
  } finally {
    await db.$disconnect()
  }
}

main().catch(() => {
  console.error('Admin creation failed due to a database error.')
  process.exit(1)
})
