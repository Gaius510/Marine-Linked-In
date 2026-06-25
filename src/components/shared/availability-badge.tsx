'use client'

import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import { cn } from '@/lib/utils'
import type { Availability } from '@/lib/types'

const config: Record<Availability, { labelKey: string; tone: StatusTone; dot: string }> = {
  AVAILABLE: { labelKey: 'availability.AVAILABLE', tone: 'success', dot: 'bg-emerald-500' },
  ON_BOARD: { labelKey: 'availability.ON_BOARD', tone: 'warning', dot: 'bg-amber-500' },
  UNAVAILABLE: { labelKey: 'availability.UNAVAILABLE', tone: 'neutral', dot: 'bg-muted-foreground' },
}

export function AvailabilityBadge({ availability, t }: { availability: Availability; t: (k: string) => string }) {
  const c = config[availability]
  return (
    <StatusPill tone={c.tone} className="gap-1.5 font-medium">
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {t(c.labelKey)}
    </StatusPill>
  )
}
