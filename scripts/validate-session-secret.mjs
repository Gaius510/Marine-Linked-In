import { getSessionSecret } from '../src/lib/session-secret.mjs'

try {
  getSessionSecret()
} catch (error) {
  const message = error instanceof Error ? error.message : 'SESSION_SECRET is invalid'
  console.error(message)
  process.exit(1)
}
