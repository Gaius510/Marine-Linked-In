'use client'

import { create } from 'zustand'

export type SeafarerView = 'overview' | 'cv' | 'jobs' | 'applications'
export type RecruiterView = 'overview' | 'browse' | 'postJob' | 'myJobs' | 'saved' | 'interviews' | 'messages'
export type AdminView = 'overview' | 'masterList'

interface NavState {
  view: string
  setView: (view: string) => void
  // optional context (e.g. selected seafarer/job id)
  contextId: string | null
  setContext: (id: string | null) => void
}

export const useNavStore = create<NavState>((set) => ({
  view: 'overview',
  setView: (view) => set({ view, contextId: null }),
  contextId: null,
  setContext: (id) => set({ contextId: id }),
}))
