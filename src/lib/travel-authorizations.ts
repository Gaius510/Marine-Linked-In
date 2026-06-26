export type TravelAuthorizationType =
  | 'US_C1_D'
  | 'SCHENGEN'
  | 'UK_TRANSIT_OR_SEAFARER'
  | 'AU_MARITIME_CREW'
  | 'OTHER'

export type TravelAuthorizationVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'

export type TravelAuthorizationExpiryStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY'

export const TRAVEL_AUTHORIZATION_EXPIRING_SOON_DAYS = 90

export interface TravelAuthorizationRecord {
  id: string
  seafarerId: string
  type: TravelAuthorizationType
  customType: string | null
  countryCode: string | null
  documentNumber: string | null
  issuedAt: Date | string | null
  expiresAt: Date | string | null
  notes: string | null
  verificationStatus: TravelAuthorizationVerificationStatus
  createdAt: Date | string
  updatedAt: Date | string
}

export type OwnTravelAuthorization = TravelAuthorizationRecord

export type PublicTravelAuthorizationSummary = Pick<
  TravelAuthorizationRecord,
  'id' | 'type' | 'customType' | 'countryCode' | 'expiresAt' | 'verificationStatus'
>

export function deriveTravelAuthorizationExpiryStatus(
  expiresAt: Date | string | null | undefined,
  now = new Date()
): TravelAuthorizationExpiryStatus {
  if (!expiresAt) return 'NO_EXPIRY'
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return 'NO_EXPIRY'
  if (expiry.getTime() <= now.getTime()) return 'EXPIRED'
  const expiringSoonMs = TRAVEL_AUTHORIZATION_EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000
  return expiry.getTime() - now.getTime() <= expiringSoonMs ? 'EXPIRING_SOON' : 'VALID'
}

export function sanitizeTravelAuthorizationForRecruiter(
  authorization: TravelAuthorizationRecord
): PublicTravelAuthorizationSummary {
  return {
    id: authorization.id,
    type: authorization.type,
    customType: authorization.customType,
    countryCode: authorization.countryCode,
    expiresAt: authorization.expiresAt,
    verificationStatus: authorization.verificationStatus,
  }
}

export function sanitizeTravelAuthorizationsForRecruiter(
  authorizations: TravelAuthorizationRecord[] | null | undefined
): PublicTravelAuthorizationSummary[] {
  return (authorizations ?? []).map(sanitizeTravelAuthorizationForRecruiter)
}
