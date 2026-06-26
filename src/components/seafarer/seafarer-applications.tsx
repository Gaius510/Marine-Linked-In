'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { Application, ApplicationStatus, Job } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusPill } from '@/components/shared/status-pill'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatSalaryRange, safeText } from '@/lib/format'
import {
  Briefcase,
  Building2,
  CalendarClock,
  Clock,
  FileText,
  MapPin,
  Send,
  Ship,
  Wallet,
} from 'lucide-react'

const statusTone: Record<ApplicationStatus, 'warning' | 'info' | 'success' | 'danger' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
}

export function SeafarerApplications() {
  const { t } = useI18n()
  const { setView } = useNavStore()
  const { data, isLoading, isError, refetch } = useSeafarerProfile()

  const applications = useMemo(() => {
    const items = (data?.profile?.applications ?? []) as Application[]
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data?.profile?.applications])

  const summary = useMemo(() => ({
    pending: applications.filter((app) => app.status === 'PENDING').length,
    shortlisted: applications.filter((app) => app.status === 'SHORTLISTED').length,
    hired: applications.filter((app) => app.status === 'HIRED').length,
  }), [applications])

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('seafarer.myApplications')}
        subtitle={t('seafarer.myApplicationsHint')}
        icon={<Send className="size-5" />}
        action={
          <Button onClick={() => setView('jobs')} className="w-full sm:w-auto">
            <Briefcase className="size-4" />
            {t('nav.jobs')}
          </Button>
        }
      />

      <PageToolbar className="rounded-lg border border-border/70 bg-card/80 px-3 py-2">
        <div className="text-sm font-medium">
          {isLoading ? t('common.loading') : t('seafarer.applicationsSummary', { count: applications.length })}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="warning">{t('seafarer.pendingCount', { count: summary.pending })}</StatusPill>
          <StatusPill tone="success">{t('seafarer.shortlistedCount', { count: summary.shortlisted })}</StatusPill>
          <StatusPill tone="primary">{t('seafarer.hiredCount', { count: summary.hired })}</StatusPill>
        </div>
      </PageToolbar>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Send}
          title={t('seafarer.noApplications')}
          description={t('seafarer.noApplicationsDesc')}
          action={(
            <Button onClick={() => setView('jobs')}>
              <Briefcase className="size-4" />
              {t('nav.jobs')}
            </Button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  const { t } = useI18n()
  const status = app.status
  const job = app.job
  const salary = formatJobSalary(job)

  return (
    <SectionCard className="p-4 sm:p-5" contentClassName="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-base font-semibold">
              {safeText(job?.title, t('common.notProvided'))}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" />
                {safeText(job?.companyName, t('common.notProvided'))}
              </span>
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3.5" />
                {t('jobs.appliedOn')} {formatDate(app.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <StatusPill tone={statusTone[status]} className="self-start">
          {t(`jobs.applicationStatus.${status}`)}
        </StatusPill>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <ApplicationFact icon={<Briefcase className="size-4" />} label={t('cv.rank')} value={safeText(job?.rank, t('common.notProvided'))} />
        <ApplicationFact icon={<Ship className="size-4" />} label={t('cv.vesselType')} value={safeText(job?.vesselType, t('common.notProvided'))} />
        <ApplicationFact icon={<Clock className="size-4" />} label={t('jobs.contractDuration')} value={safeText(job?.contractDuration, t('common.notProvided'))} />
        <ApplicationFact icon={<CalendarClock className="size-4" />} label={t('jobs.joiningDate')} value={job?.joiningDate ? formatDate(job.joiningDate) : t('common.notProvided')} />
        <ApplicationFact icon={<MapPin className="size-4" />} label={t('common.location')} value={safeText(job?.location, t('common.notProvided'))} />
        <ApplicationFact icon={<Wallet className="size-4" />} label={t('jobs.salaryRange')} value={salary || t('common.notProvided')} />
      </div>

      {(app.message || job?.description) && (
        <div className="grid gap-3 md:grid-cols-2">
          {app.message && (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Send className="size-3.5 text-primary" />
                {t('jobs.applyMessage')}
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{app.message}</p>
            </div>
          )}
          {job?.description && (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="size-3.5 text-primary" />
                {t('jobs.description')}
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{job.description}</p>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function ApplicationFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="truncate font-medium">{value}</div>
    </div>
  )
}

function formatJobSalary(job?: Job) {
  if (!job) return ''
  return formatSalaryRange(job.salaryMin, job.salaryMax, job.currency, '')
}
