'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { AvailabilityBadge } from './availability-badge'
import { formatDate, formatYears } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
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
  const certificates = seafarer.certificates ?? []
  const vesselTypes = Array.from(new Set(vesselExperiences.map((e) => e.vesselType))).slice(0, 3)
  const location = [seafarer.user.city, seafarer.user.country].filter(Boolean).join(', ')

  return (
    <Card
      className={cn(
        'min-w-0 p-3 sm:p-4',
        onClick && 'hover:border-primary/35',
        selected && 'border-primary/50 bg-secondary/35'
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
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-secondary font-semibold text-primary">{initials}</AvatarFallback>
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
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                {seafarer.rank && <span className="font-medium text-foreground">{seafarer.rank}</span>}
                {seafarer.rank && seafarer.yearsExperience && <span aria-hidden="true">·</span>}
                {seafarer.yearsExperience && <span>{formatYears(seafarer.yearsExperience)}</span>}
              </div>
            </div>
            <AvailabilityBadge availability={seafarer.availability} t={t} className="self-start" />
          </div>

          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {seafarer.nationality && <span>{seafarer.nationality}</span>}
              {location && <span className="min-w-0 truncate">{location}</span>}
            </div>
            {seafarer.availableFrom && (
              <span>{t('browse.availableFrom')}: {formatDate(seafarer.availableFrom)}</span>
            )}
          </div>

          <div className="mt-2 border-t border-border/70 pt-2 text-xs text-muted-foreground">
            <p>
              {t('cv.experienceCount', { count: vesselExperiences.length })} · {t('cv.certificatesCount', { count: certificates.length })}
            </p>
            {vesselTypes.length > 0 && <p className="mt-1 truncate">{vesselTypes.join(' · ')}</p>}
          </div>

          {showSaved && seafarer._count && (
            <div className="mt-3 text-[11px] text-muted-foreground">
              {t('browse.savedByCount', { count: seafarer._count.savedBy })} · {t('browse.applicationsCount', { count: seafarer._count.applications })}
            </div>
          )}
        </div>
      </div>
      {(onClick || actions) && (
        <div className="mt-3 flex min-w-0 flex-wrap items-stretch gap-1.5 border-t border-border/70 pt-2.5 [&>[data-slot=button]]:min-w-0 [&>[data-slot=button]]:flex-1 sm:[&>[data-slot=button]]:flex-none">
          {onClick && (
            <Button type="button" size="sm" className="h-8 flex-1" onClick={onClick}>
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
