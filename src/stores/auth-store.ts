'use client'

import { create } from 'zustand'
import type { SafeUser, Role } from '@/lib/types'
import { api, fetchUser } from '@/lib/api'
import { queryClient } from '@/lib/query-client'

interface AuthState {
  user: SafeUser | null
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<SafeUser>
  register: (data: {
    email: string
    password: string
    name: string
    role: Role
    company?: string
    phone?: string
    city?: string
    country?: string
  }) => Promise<SafeUser>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    const user = await fetchUser()
    set({ user, initialized: true })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await api.post<{ user: SafeUser }>('/api/auth/login', { email, password })
      // Clear any cached queries (and errors) from a previous session so the
      // new role's portal starts fresh — prevents stale 403s from leaking in.
      queryClient.clear()
      set({ user: res.user })
      return res.user
    } finally {
      set({ loading: false })
    }
  },

  register: async (data) => {
    set({ loading: true })
    try {
      const res = await api.post<{ user: SafeUser }>('/api/auth/register', data)
      queryClient.clear()
      set({ user: res.user })
      return res.user
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    await api.post('/api/auth/logout')
    queryClient.clear()
    set({ user: null })
  },
}))
