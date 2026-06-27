'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { AvailabilityBadge } from './availability-badge'
import { StatusPill } from '@/components/shared/status-pill'
import { formatDate, formatYears } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Ship, MapPin, Calendar, Anchor, Clock, Eye } from 'lucide-react'
import type { SeafarerWithOptionalRelations } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface SeafarerCardProps {
  seafarer: SeafarerWithOptionalRelations
  selectable?: boolean
  selected?: boolean
  onSelect?: (checked: boolean) => void
  actions?: React.ReactNode
  onClick?: () => void
  showSaved?: boolean
}

export function SeafarerCard({ seafarer, selectable, selected, onSelect, actions, onClick, showSaved }: SeafarerCardProps) {
  const { t } = useI18n()
  const initials = seafarer.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const vesselExperiences = seafarer.vesselExperiences ?? []
  const vesselTypes = Array.from(new Set(vesselExperiences.map((e) => e.vesselType))).slice(0, 3)
  const location = [seafarer.user.city, seafarer.user.country].filter(Boolean).join(', ')

  return (
    <Card
      className={cn(
        'min-w-0 p-4',
        onClick && 'motion-card-hover cursor-pointer hover:border-primary/35',
        selected && 'border-primary/45 bg-secondary/45 shadow-sm ring-1 ring-primary/20'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect?.(!!v)}
            className="mt-1"
            aria-label={t(selected ? 'browse.deselectCandidate' : 'browse.selectCandidate', { name: seafarer.user.name })}
          />
        )}
        <Avatar className="size-12 shrink-0 rounded-xl">
          <AvatarFallback className="rounded-xl bg-secondary font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onClick}
                disabled={!onClick}
                className="block max-w-full truncate rounded-sm text-start text-base font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default enabled:cursor-pointer"
              >
                {seafarer.user.name}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                {seafarer.rank && (
                  <span className="flex min-w-0 items-center gap-1 font-medium text-foreground">
                    <Anchor className="size-3.5" />
                    <span className="truncate">{seafarer.rank}</span>
                  </span>
                )}
                {seafarer.yearsExperience && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatYears(seafarer.yearsExperience)}
                  </span>
                )}
              </div>
            </div>
            <AvailabilityBadge availability={seafarer.availability} t={t} className="self-start" />
          </div>

          <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {seafarer.nationality && <span>{seafarer.nationality}</span>}
              {location && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="size-3" />
                  <span className="truncate">{location}</span>
                </span>
              )}
            </div>
            {seafarer.availableFrom && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {t('browse.availableFrom')}: {formatDate(seafarer.availableFrom)}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {vesselTypes.length > 0 ? (
              vesselTypes.map((vt) => (
                <StatusPill key={vt} tone="neutral" className="gap-1 text-[11px] font-normal">
                  <Ship className="size-3" />
                  {vt}
                </StatusPill>
              ))
            ) : (
              <StatusPill tone="neutral" className="text-[11px] font-normal">
                {t('browse.noExperience')}
              </StatusPill>
            )}
            {vesselTypes.length > 0 && vesselExperiences.length > vesselTypes.length && (
              <StatusPill tone="primary" className="text-[11px] font-normal">
                +{vesselExperiences.length - vesselTypes.length}
              </StatusPill>
            )}
          </div>

          {showSaved && seafarer._count && (
            <div className="mt-3 text-[11px] text-muted-foreground">
              {t('browse.savedByCount', { count: seafarer._count.savedBy })} · {t('browse.applicationsCount', { count: seafarer._count.applications })}
            </div>
          )}
        </div>
      </div>
      {(onClick || actions) && (
        <div className="mt-4 flex min-w-0 flex-wrap items-stretch gap-2 border-t border-border/70 pt-3 [&>[data-slot=button]]:min-w-0 [&>[data-slot=button]]:flex-1 sm:[&>[data-slot=button]]:flex-none">
          {onClick && (
            <Button type="button" variant="outline" size="sm" className="h-8 flex-1" onClick={onClick}>
              <Eye className="size-4" />
              {t('common.viewProfile')}
            </Button>
          )}
          {actions}
        </div>
      )}
    </Card>
  )
}
