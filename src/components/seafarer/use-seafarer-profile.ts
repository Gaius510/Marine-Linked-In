'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useUpdateSeafarerProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: object) => api.put('/api/seafarers/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export function useDeleteVesselExperience() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.del(`/api/seafarers/me/experiences/${id}?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export function useDeleteCertificate() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.del(`/api/seafarers/me/certificates/${id}?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export type { MeResponse }
