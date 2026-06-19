'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AvailabilityBadge } from './availability-badge'
import { Ship, MapPin, Calendar, Anchor } from 'lucide-react'
import type { SeafarerWithRelations } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface SeafarerCardProps {
  seafarer: SeafarerWithRelations
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
  const vesselTypes = Array.from(new Set(seafarer.vesselExperiences.map((e) => e.vesselType))).slice(0, 3)

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect?.(!!v)}
            className="mt-1"
            aria-label={seafarer.user.name}
          />
        )}
        <Avatar className="size-12 rounded-xl bg-primary/10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold rounded-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                onClick={onClick}
                disabled={!onClick}
                className="font-semibold text-base hover:text-primary transition-colors text-start truncate block max-w-full disabled:cursor-default"
              >
                {seafarer.user.name}
              </button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                {seafarer.rank && (
                  <span className="flex items-center gap-1">
                    <Anchor className="size-3.5" />
                    {seafarer.rank}
                  </span>
                )}
                {seafarer.yearsExperience && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{seafarer.yearsExperience} {t('browse.yearsMin').toLowerCase()}</span>
                  </>
                )}
              </div>
            </div>
            <AvailabilityBadge availability={seafarer.availability} t={t} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
            {seafarer.nationality && <span>{seafarer.nationality}</span>}
            {(seafarer.user.city || seafarer.user.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {[seafarer.user.city, seafarer.user.country].filter(Boolean).join(', ')}
              </span>
            )}
            {seafarer.availableFrom && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {seafarer.availableFrom}
              </span>
            )}
          </div>

          {vesselTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {vesselTypes.map((vt) => (
                <Badge key={vt} variant="secondary" className="text-[11px] gap-1 font-normal">
                  <Ship className="size-3" />
                  {vt}
                </Badge>
              ))}
              {seafarer.vesselExperiences.length > vesselTypes.length && (
                <Badge variant="outline" className="text-[11px] font-normal">
                  +{seafarer.vesselExperiences.length - vesselTypes.length}
                </Badge>
              )}
            </div>
          )}

          {showSaved && seafarer._count && (
            <div className="text-[11px] text-muted-foreground mt-2">
              {seafarer._count.savedBy} recruiters · {seafarer._count.applications} applications
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 mt-3 pt-3 border-t">{actions}</div>}
    </Card>
  )
}
