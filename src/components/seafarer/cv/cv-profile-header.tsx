'use client'

import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/lib/i18n'
import { formatYears, safeText } from '@/lib/format'
import type { SeafarerCvProfile } from './types'
import { Anchor, FileText, Save } from 'lucide-react'

export function CvProfileHeader({
  profile,
  completeness,
  strengthLabel,
  isSaving,
  onSaveCurrent,
}: {
  profile: SeafarerCvProfile
  completeness: number
  strengthLabel: string
  isSaving: boolean
  onSaveCurrent?: () => void
}) {
  const { t } = useI18n()

  return (
    <PageToolbar className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.user.name}</h1>
            <AvailabilityBadge availability={profile.availability} t={t} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {safeText(profile.rank, t('common.notProvided'))}
            {' · '}
            {formatYears(profile.yearsExperience, t('common.notProvided'))}
          </p>
          <div className="mt-3 max-w-xl">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                <Anchor className="size-3.5 text-primary" />
                {t('seafarer.cvProgress')}
              </span>
              <span className="font-semibold text-foreground">{completeness}%</span>
            </div>
            <Progress value={completeness} />
            <p className="mt-1 text-xs text-muted-foreground">{strengthLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
        <StatusPill tone={completeness >= 80 ? 'success' : completeness >= 40 ? 'warning' : 'danger'}>
          {t('seafarer.profileStrength')}: {completeness}%
        </StatusPill>
        {onSaveCurrent && (
          <Button onClick={onSaveCurrent} disabled={isSaving} className="w-full sm:w-auto">
            <Save className="size-4" />
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        )}
      </div>
    </PageToolbar>
  )
}
