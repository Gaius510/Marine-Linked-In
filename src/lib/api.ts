import type { SafeUser } from './types'

export class ApiError extends Error {
  fields?: Record<string, string>
  status: number

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const payload = data as { error?: string; fields?: Record<string, string> }
    throw new ApiError(payload.error || 'request_failed', res.status, payload.fields)
  }
  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export async function fetchUser(): Promise<SafeUser | null> {
  try {
    const res = await api.get<{ user: SafeUser | null }>('/api/auth/me')
    return res.user
  } catch {
    return null
  }
}
