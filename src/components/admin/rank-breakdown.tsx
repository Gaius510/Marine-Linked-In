'use client'

import { useMemo } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { useI18n } from '@/lib/i18n'
import type { SeafarerWithOptionalRelations } from '@/lib/types'
import { Anchor } from 'lucide-react'

interface RankBreakdownProps {
  seafarers: SeafarerWithOptionalRelations[]
}

export function RankBreakdown({ seafarers }: RankBreakdownProps) {
  const { t } = useI18n()

  const { rows, max, represented } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const seafarer of seafarers) {
      const rank = seafarer.rank?.trim() || t('admin.notSpecified')
      counts.set(rank, (counts.get(rank) ?? 0) + 1)
    }
    const rowsArr = Array.from(counts.entries())
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => b.count - a.count || a.rank.localeCompare(b.rank))
      .slice(0, 8)

    return {
      rows: rowsArr,
      max: rowsArr.reduce((highest, row) => Math.max(highest, row.count), 0) || 1,
      represented: counts.size,
    }
  }, [seafarers, t])

  return (
    <SectionCard
      title={t('admin.rankBreakdown')}
      subtitle={t('admin.rankDistribution')}
      action={<StatusPill tone="neutral">{represented} {t('admin.rankGroups')}</StatusPill>}
    >
      {rows.length === 0 ? (
        <EmptyState icon={Anchor} title={t('common.noData')} framed={false} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const percent = Math.round((row.count / max) * 100)
            return (
              <div key={row.rank} className="grid grid-cols-[minmax(6rem,10rem)_minmax(0,1fr)_2.5rem] items-center gap-3">
                <div className="truncate text-sm font-medium">{row.rank}</div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <div className="text-end text-sm font-semibold tabular-nums">{row.count}</div>
                <div className="sr-only" role="img" aria-label={`${row.rank}: ${row.count}`} />
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
