'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SeafarerWithRelations, Application, TravelAuthorization } from '@/lib/types'
import type {
  TravelAuthorizationCreateInput,
  TravelAuthorizationUpdateInput,
} from '@/lib/validation/travel-authorizations'

type OwnSeafarerProfile = Omit<SeafarerWithRelations, 'travelAuthorizations'> & {
  applications: Application[]
  travelAuthorizations?: TravelAuthorization[]
}

interface MeResponse {
  profile: OwnSeafarerProfile
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

export function useCreateTravelAuthorization() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: TravelAuthorizationCreateInput) =>
      api.post<{ travelAuthorization: TravelAuthorization }>('/api/seafarers/me/travel-authorizations', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export function useUpdateTravelAuthorization() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TravelAuthorizationUpdateInput }) =>
      api.put<{ travelAuthorization: TravelAuthorization }>(`/api/seafarers/me/travel-authorizations/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export function useDeleteTravelAuthorization() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/api/seafarers/me/travel-authorizations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
    },
  })
}

export type { MeResponse }
