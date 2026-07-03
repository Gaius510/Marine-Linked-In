export const MIN_SESSION_SECRET_LENGTH = 32

export function getSessionSecret(env = process.env) {
  const secret = env.SESSION_SECRET?.trim()
  if (!secret) {
    throw new Error('SESSION_SECRET is required')
  }

  const normalizedSecret = secret.toLowerCase()
  if (
    normalizedSecret.includes('placeholder') ||
    normalizedSecret.includes('replace-this') ||
    normalizedSecret.includes('change-me')
  ) {
    throw new Error('SESSION_SECRET must be generated and must not be a placeholder')
  }

  if (secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters`)
  }

  return secret
}
