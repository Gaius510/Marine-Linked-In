'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { formatDate, formatSalaryRange, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { Job } from '@/lib/types'
import { Send } from 'lucide-react'

interface JobDetailDialogProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (job: Job) => void
}

export function JobDetailDialog({ job, open, onOpenChange, onApply }: JobDetailDialogProps) {
  const { t } = useI18n()
  if (!job) return null

  const alreadyApplied = !!job.myApplicationStatus
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[min(58rem,calc(100vw-2rem))]">
        <DialogHeader className="border-b border-border/70 bg-card/95 px-5 py-4 pe-12 text-start">
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <DialogDescription>
            {safeText(job.companyName)}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="space-y-5">
            <SectionCard
              title={t('jobs.positionSummary')}
              action={
                alreadyApplied && job.myApplicationStatus ? (
                  <StatusPill tone="primary">
                    {t(`jobs.applicationStatus.${job.myApplicationStatus}`)}
                  </StatusPill>
                ) : (
                  <StatusPill tone={job.status === 'OPEN' ? 'success' : 'neutral'}>
                    {job.status === 'OPEN' ? t('jobs.open') : t('jobs.closed')}
                  </StatusPill>
                )
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t('cv.rank')} value={safeText(job.rank)} />
                <DetailRow label={t('common.company')} value={safeText(job.companyName)} />
              </div>
            </SectionCard>

            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title={t('jobs.vesselContractSection')}>
                <div className="grid gap-3">
                  <DetailRow label={t('cv.vesselType')} value={safeText(job.vesselType)} />
                  <DetailRow label={t('jobs.contractDuration')} value={safeText(job.contractDuration)} />
                </div>
              </SectionCard>

              <SectionCard title={t('jobs.compensationLocationSection')}>
                <div className="grid gap-3">
                  <DetailRow label={t('jobs.salaryRange').replace(' (per month)', '')} value={salary} />
                  <DetailRow label={t('common.location')} value={safeText(job.location)} />
                </div>
              </SectionCard>
            </div>

            <SectionCard title={t('jobs.joiningInformationSection')}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t('jobs.joiningDate')} value={job.joiningDate ? formatDate(job.joiningDate) : t('common.notProvided')} />
                <DetailRow label={t('jobs.applicants')} value={t('jobs.applicantsCount', { count: job._count?.applications ?? 0 })} />
              </div>
            </SectionCard>

            <SectionCard title={t('jobs.descriptionRequirementsSection')}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{t('jobs.description')}</h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {safeText(job.description, t('common.notProvided'))}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{t('jobs.requirements')}</h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {safeText(job.requirements, t('common.notProvided'))}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 bg-card/95 p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {alreadyApplied ? (
            <Button disabled>{t('jobs.alreadyApplied')}</Button>
          ) : (
            <Button onClick={() => onApply(job)}>
              <Send className="size-4" />
              {t('seafarer.applyNow')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-border pt-2">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}
