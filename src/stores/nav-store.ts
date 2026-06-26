'use client'

import { create } from 'zustand'
import type { Role } from '@/lib/types'

export type { AdminView, AppView, RecruiterView, SeafarerView, ViewSlug } from '@/lib/navigation'

interface UrlSyncSnapshot {
  role: Role | null
  pathname: string
  searchKey: string
  view: string
}

interface NavState {
  view: string
  setView: (view: string) => void
  // optional context (e.g. selected seafarer/job id)
  contextId: string | null
  setContext: (id: string | null) => void
  urlSyncSnapshot: UrlSyncSnapshot
  setUrlSyncSnapshot: (snapshot: UrlSyncSnapshot) => void
}

export const useNavStore = create<NavState>((set) => ({
  view: 'overview',
  setView: (view) => set({ view, contextId: null }),
  contextId: null,
  setContext: (id) => set({ contextId: id }),
  urlSyncSnapshot: {
    role: null,
    pathname: '',
    searchKey: '',
    view: '',
  },
  setUrlSyncSnapshot: (urlSyncSnapshot) => set({ urlSyncSnapshot }),
}))
