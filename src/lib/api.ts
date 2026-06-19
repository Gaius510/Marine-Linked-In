import type { SafeUser } from './types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'request_failed')
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
