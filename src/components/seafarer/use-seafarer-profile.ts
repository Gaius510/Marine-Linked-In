'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SeafarerWithRelations, Application } from '@/lib/types'

interface MeResponse {
  profile: SeafarerWithRelations & { applications: Application[] }
}

/**
 * react-query hook for the authenticated seafarer's own profile.
 * Used across the seafarer portal — invalidating ['seafarer','me']
 * refreshes everything.
 */
export function useSeafarerProfile() {
  return useQuery<MeResponse>({
    queryKey: ['seafarer', 'me'],
    queryFn: () => api.get<MeResponse>('/api/seafarers/me'),
  })
}

export type { MeResponse }
