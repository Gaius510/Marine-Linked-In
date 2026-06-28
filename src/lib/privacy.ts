import type {
  TravelAuthorizationType,
  TravelAuthorizationVerificationStatus,
} from '@/lib/travel-authorizations'

const ABSENT_LEGACY_VALUES = new Set(['', 'none', 'no', 'n/a', 'na', 'false'])

interface SerializableUser {
  id: string
  name: string
  role?: string
  company?: string | null
  city?: string | null
  country?: string | null
  createdAt?: Date | string
}

interface SerializableCertificate {
  id: string
  seafarerId: string
  name: string
  number?: string | null
  issuedDate: string | null
  expiryDate: string | null
  issuingAuthority: string | null
}

interface SerializableVesselExperience {
  id: string
  seafarerId: string
  rank: string | null
  vesselType: string
  vesselName: string | null
  companyName: string | null
  imoNumber: string | null
  grossTonnage: string | null
  engineType: string | null
  tradeArea: string | null
  signOnDate: string | null
  signOffDate: string | null
  captainName?: string | null
  captainContact?: string | null
  chiefEngName?: string | null
  chiefEngContact?: string | null
}

interface SerializableTravelAuthorization {
  id: string
  type: TravelAuthorizationType
  customType: string | null
  countryCode: string | null
  expiresAt: Date | string | null
  verificationStatus: TravelAuthorizationVerificationStatus
}

interface SerializableSeafarerProfile {
  id: string
  rank: string | null
  nationality: string | null
  dateOfBirth?: string | null
  availability: string
  availableFrom: string | null
  yearsExperience: string | null
  bio: string | null
  avatarUrl: string | null
  cocGrade: string | null
  cocExpiry: string | null
  passportNo?: string | null
  passportExpiry: string | null
  usVisa?: string | null
  schengenVisa?: string | null
  user?: SerializableUser
  certificates?: SerializableCertificate[]
  vesselExperiences?: SerializableVesselExperience[]
  travelAuthorizations?: SerializableTravelAuthorization[]
  _count?: { savedBy: number; applications: number }
}

function hasLegacyTravelValue(value: string | null | undefined) {
  return !ABSENT_LEGACY_VALUES.has((value ?? '').trim().toLowerCase())
}

function legacyTravelAuthorizationSummaries(profile: Pick<SerializableSeafarerProfile, 'usVisa' | 'schengenVisa'>) {
  const summaries: SerializableTravelAuthorization[] = []

  if (hasLegacyTravelValue(profile.usVisa)) {
    summaries.push({
      id: 'legacy-us-visa',
      type: 'US_C1_D',
      customType: null,
      countryCode: 'US',
      expiresAt: null,
      verificationStatus: 'UNVERIFIED',
    })
  }

  if (hasLegacyTravelValue(profile.schengenVisa)) {
    summaries.push({
      id: 'legacy-schengen-visa',
      type: 'SCHENGEN',
      customType: null,
      countryCode: null,
      expiresAt: null,
      verificationStatus: 'UNVERIFIED',
    })
  }

  return summaries
}

export function sanitizeUserForCandidateAccess(user: SerializableUser) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    company: user.company ?? null,
    city: user.city ?? null,
    country: user.country ?? null,
    createdAt: user.createdAt,
    email: null,
    phone: null,
  }
}

export function sanitizeCertificateForCandidateAccess(certificate: SerializableCertificate) {
  return {
    id: certificate.id,
    seafarerId: certificate.seafarerId,
    name: certificate.name,
    issuedDate: certificate.issuedDate,
    expiryDate: certificate.expiryDate,
    issuingAuthority: certificate.issuingAuthority,
  }
}

export function sanitizeVesselExperienceForCandidateAccess(experience: SerializableVesselExperience) {
  return {
    id: experience.id,
    seafarerId: experience.seafarerId,
    rank: experience.rank,
    vesselType: experience.vesselType,
    vesselName: experience.vesselName,
    companyName: experience.companyName,
    imoNumber: experience.imoNumber,
    grossTonnage: experience.grossTonnage,
    engineType: experience.engineType,
    tradeArea: experience.tradeArea,
    signOnDate: experience.signOnDate,
    signOffDate: experience.signOffDate,
    referenceContactAvailable: Boolean(
      experience.captainName ||
      experience.captainContact ||
      experience.chiefEngName ||
      experience.chiefEngContact
    ),
  }
}

export function sanitizeTravelAuthorizationsForCandidateAccess(
  profile: Pick<SerializableSeafarerProfile, 'travelAuthorizations' | 'usVisa' | 'schengenVisa'>
) {
  const current = (profile.travelAuthorizations ?? []).map((authorization) => ({
    id: authorization.id,
    type: authorization.type,
    customType: authorization.customType,
    countryCode: authorization.countryCode,
    expiresAt: authorization.expiresAt,
    verificationStatus: authorization.verificationStatus,
  }))

  return current.length > 0 ? current : legacyTravelAuthorizationSummaries(profile)
}

export function sanitizeSeafarerForCandidateAccess(
  profile: SerializableSeafarerProfile,
  options: { savedByMe?: boolean } = {}
) {
  return {
    id: profile.id,
    rank: profile.rank,
    nationality: profile.nationality,
    dateOfBirth: null,
    availability: profile.availability,
    availableFrom: profile.availableFrom,
    yearsExperience: profile.yearsExperience,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    cocGrade: profile.cocGrade,
    cocExpiry: profile.cocExpiry,
    passportNo: null,
    passportRecorded: Boolean(profile.passportNo),
    passportExpiry: profile.passportExpiry,
    usVisa: null,
    schengenVisa: null,
    user: profile.user ? sanitizeUserForCandidateAccess(profile.user) : undefined,
    certificates: (profile.certificates ?? []).map(sanitizeCertificateForCandidateAccess),
    vesselExperiences: (profile.vesselExperiences ?? []).map(sanitizeVesselExperienceForCandidateAccess),
    travelAuthorizations: sanitizeTravelAuthorizationsForCandidateAccess(profile),
    _count: profile._count,
    savedByMe: options.savedByMe,
  }
}
