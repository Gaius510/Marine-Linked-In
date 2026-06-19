'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import type { SeafarerWithRelations } from '@/lib/types'

interface RankBreakdownProps {
  seafarers: SeafarerWithRelations[]
}

/**
 * Simple horizontal bar chart of seafarer counts per rank.
 * Pure divs (no chart library) — keeps bundle light and renders crisply in RTL.
 */
export function RankBreakdown({ seafarers }: RankBreakdownProps) {
  const { t } = useI18n()

  const { rows, max } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of seafarers) {
      const rank = s.rank || '—'
      counts.set(rank, (counts.get(rank) ?? 0) + 1)
    }
    const rowsArr = Array.from(counts.entries())
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
    return { rows: rowsArr, max: rowsArr.reduce((m, r) => Math.max(m, r.count), 0) || 1 }
  }, [seafarers])

  if (rows.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('admin.rankBreakdown')}</h3>
        <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-sm font-semibold mb-4">{t('admin.rankBreakdown')}</h3>
      <div className="space-y-2.5">
        {rows.map((row) => {
          const pct = Math.round((row.count / max) * 100)
          return (
            <div key={row.rank} className="flex items-center gap-3">
              <div className="w-28 sm:w-32 shrink-0 text-xs sm:text-sm text-muted-foreground truncate text-end">
                {row.rank}
              </div>
              <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden">
                <div
                  className="h-full rounded-md bg-primary/80 transition-all"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={row.count}
                  aria-valuemin={0}
                  aria-valuemax={max}
                />
              </div>
              <div className="w-8 shrink-0 text-xs font-medium text-end tabular-nums">{row.count}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
