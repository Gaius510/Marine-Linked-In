import type { SeafarerWithRelations } from '@/lib/types'

/**
 * Compute CV completeness percentage (0-100) based on which profile
 * fields and related records are filled. Weights are tuned to reflect
 * what recruiters care about most: rank, sea service, certificates.
 */
export function computeCompleteness(profile: SeafarerWithRelations | undefined | null): number {
  if (!profile) return 0

  const checks: Array<{ ok: boolean; weight: number }> = [
    { ok: !!profile.rank, weight: 12 },
    { ok: !!profile.nationality, weight: 6 },
    { ok: !!profile.dateOfBirth, weight: 4 },
    { ok: !!profile.yearsExperience, weight: 6 },
    { ok: !!profile.bio && profile.bio.trim().length > 0, weight: 8 },
    { ok: !!profile.cocGrade, weight: 6 },
    { ok: !!profile.cocExpiry, weight: 3 },
    { ok: !!profile.user.phone, weight: 4 },
    { ok: !!profile.user.city || !!profile.user.country, weight: 4 },
    { ok: !!profile.passportNo, weight: 4 },
    { ok: !!profile.passportExpiry, weight: 2 },
    { ok: profile.vesselExperiences.length > 0, weight: 18 },
    { ok: profile.vesselExperiences.length >= 2, weight: 6 },
    { ok: profile.vesselExperiences.some((e) => !!e.captainName || !!e.chiefEngName), weight: 6 },
    { ok: profile.certificates.length > 0, weight: 8 },
    { ok: profile.certificates.length >= 2, weight: 3 },
  ]

  const total = checks.reduce((s, c) => s + c.weight, 0)
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  return Math.round((got / total) * 100)
}

/** Strength bucket key based on completeness % */
export function strengthKey(pct: number): 'seafarer.profileLow' | 'seafarer.profileMid' | 'seafarer.profileHigh' {
  if (pct < 40) return 'seafarer.profileLow'
  if (pct < 80) return 'seafarer.profileMid'
  return 'seafarer.profileHigh'
}
