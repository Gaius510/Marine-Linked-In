'use client'

import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/lib/i18n'
import type { CompletionItem } from './types'
import { CheckCircle2, Circle, Compass } from 'lucide-react'

export function CvCompletionPanel({
  completeness,
  items,
  activeSection,
  onSelectSection,
}: {
  completeness: number
  items: CompletionItem[]
  activeSection: string
  onSelectSection: (section: string) => void
}) {
  const { t } = useI18n()
  const nextItem = items.find((item) => !item.complete)

  return (
    <SectionCard
      title={t('cv.completionGuidance')}
      subtitle={nextItem ? t('cv.nextRecommendedAction') : t('cv.allSectionsComplete')}
      className="lg:sticky lg:top-20"
    >
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('seafarer.cvProgress')}</span>
            <span className="font-semibold">{completeness}%</span>
          </div>
          <Progress value={completeness} />
        </div>

        {nextItem && (
          <div className="rounded-lg border border-primary/20 bg-secondary p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Compass className="size-4 text-primary" />
              {t('cv.startHere')}
            </div>
            <p className="text-sm text-muted-foreground">{nextItem.label}</p>
            <Button size="sm" className="mt-3 w-full" onClick={() => onSelectSection(nextItem.key)}>
              {t('common.view')}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectSection(item.key)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-start text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-current={activeSection === item.key ? 'true' : undefined}
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.complete ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <StatusPill tone={item.complete ? 'success' : 'warning'} className="text-[10px]">
                {item.complete ? t('cv.complete') : t('cv.incomplete')}
              </StatusPill>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
