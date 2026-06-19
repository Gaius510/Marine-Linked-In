'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Availability } from '@/lib/types'

const config: Record<Availability, { labelKey: string; className: string; dot: string }> = {
  AVAILABLE: { labelKey: 'availability.AVAILABLE', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  ON_BOARD: { labelKey: 'availability.ON_BOARD', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  UNAVAILABLE: { labelKey: 'availability.UNAVAILABLE', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
}

export function AvailabilityBadge({ availability, t }: { availability: Availability; t: (k: string) => string }) {
  const c = config[availability]
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', c.className)}>
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {t(c.labelKey)}
    </Badge>
  )
}
