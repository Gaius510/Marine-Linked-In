'use client'

import { EmptyState } from '@/components/shared/empty-state'
import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import {
  deriveTravelAuthorizationExpiryStatus,
  type PublicTravelAuthorizationSummary,
} from '@/lib/travel-authorizations'
import { CalendarClock, Globe2, ShieldCheck } from 'lucide-react'

export interface TravelAuthorizationSummaryFallbackSource {
  usVisa?: string | null
  schengenVisa?: string | null
}

const ABSENT_LEGACY_VALUES = new Set(['', 'none', 'no', 'n/a', 'na', 'false'])

function hasLegacyValue(value: string | null | undefined) {
  return !ABSENT_LEGACY_VALUES.has((value ?? '').trim().toLowerCase())
}

export function legacyTravelAuthorizationFallbacks(
  source: TravelAuthorizationSummaryFallbackSource
): PublicTravelAuthorizationSummary[] {
  const fallbacks: PublicTravelAuthorizationSummary[] = []

  if (hasLegacyValue(source.usVisa)) {
    fallbacks.push({
      id: 'legacy-us-visa',
      type: 'US_C1_D',
      customType: null,
      countryCode: 'US',
      expiresAt: null,
      verificationStatus: 'UNVERIFIED',
    })
  }

  if (hasLegacyValue(source.schengenVisa)) {
    fallbacks.push({
      id: 'legacy-schengen-visa',
      type: 'SCHENGEN',
      customType: null,
      countryCode: null,
      expiresAt: null,
      verificationStatus: 'UNVERIFIED',
    })
  }

  return fallbacks
}

export function TravelAuthorizationSummaryList({
  travelAuthorizations,
  emptyTitle,
  emptyDescription,
}: {
  travelAuthorizations?: PublicTravelAuthorizationSummary[]
  emptyTitle?: string
  emptyDescription?: string
}) {
  const { t } = useI18n()
  const authorizations = travelAuthorizations ?? []

  if (authorizations.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title={emptyTitle ?? t('travelAuth.emptyTitle')}
        description={emptyDescription ?? t('travelAuth.emptyDescription')}
        framed={false}
      />
    )
  }

  return (
    <div className="grid gap-3">
      {authorizations.map((authorization) => (
        <TravelAuthorizationSummaryCard key={authorization.id} authorization={authorization} />
      ))}
    </div>
  )
}

function TravelAuthorizationSummaryCard({
  authorization,
}: {
  authorization: PublicTravelAuthorizationSummary
}) {
  const { t } = useI18n()
  const validity = deriveTravelAuthorizationExpiryStatus(authorization.expiresAt)
  const validityTone: Record<typeof validity, StatusTone> = {
    VALID: 'success',
    EXPIRING_SOON: 'warning',
    EXPIRED: 'danger',
    NO_EXPIRY: 'neutral',
  }
  const verification = authorization.verificationStatus ?? 'UNVERIFIED'
  const verificationTone: Record<NonNullable<PublicTravelAuthorizationSummary['verificationStatus']>, StatusTone> = {
    UNVERIFIED: 'neutral',
    VERIFIED: 'success',
    REJECTED: 'danger',
  }

  return (
    <article className="rounded-lg border border-border/80 bg-background/60 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="break-words text-sm font-semibold">{authorizationName(authorization, t)}</h4>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <Info
              icon={<Globe2 className="size-3.5" />}
              label={t('cv.travelAuthCountry')}
              value={safeText(authorization.countryCode, t('common.notProvided'))}
            />
            <Info
              icon={<CalendarClock className="size-3.5" />}
              label={t('cv.travelAuthExpiresAt')}
              value={formatDate(authorization.expiresAt, t('common.notProvided'))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <StatusPill tone={validityTone[validity]}>{t(`travelAuth.validity.${validity}`)}</StatusPill>
          <StatusPill tone={verificationTone[verification]}>
            {t(`travelAuth.verification.${verification}`)}
          </StatusPill>
        </div>
      </div>
    </article>
  )
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-xs">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="break-words text-foreground">{value}</div>
    </div>
  )
}

function authorizationName(
  authorization: PublicTravelAuthorizationSummary,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (authorization.type === 'OTHER') {
    return safeText(authorization.customType, t('travelAuth.type.OTHER'))
  }

  const knownTypes = new Set(['US_C1_D', 'SCHENGEN', 'UK_TRANSIT_OR_SEAFARER', 'AU_MARITIME_CREW'])
  return knownTypes.has(authorization.type)
    ? t(`travelAuth.type.${authorization.type}`)
    : safeText(authorization.customType, t('travelAuth.unknownType'))
}
