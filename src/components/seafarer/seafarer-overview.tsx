'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Application, ApplicationStatus, Job } from '@/lib/types'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { JobCard } from '@/components/shared/job-card'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { ApplyDialog } from '@/components/seafarer/apply-dialog'
import { JobDetailDialog } from '@/components/seafarer/job-detail-dialog'
import { computeCompleteness, strengthKey } from '@/components/seafarer/profile-completeness'
import { formatDate, formatYears, safeText } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Briefcase, Send, ArrowRight, FileText, Anchor, CalendarClock, CheckCircle2, Globe2, UserRound,
} from 'lucide-react'

interface JobsResponse { jobs: Job[]; total: number }

const statusTone: Record<ApplicationStatus, 'warning' | 'info' | 'success' | 'danger' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
}

export function SeafarerOverview() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const { setView } = useNavStore()
  const { data, isLoading, isError, refetch } = useSeafarerProfile()

  const jobsQuery = useQuery<JobsResponse>({
    queryKey: ['jobs', 'overview'],
    queryFn: () => api.get<JobsResponse>('/api/jobs'),
  })

  const profile = data?.profile
  const pct = useMemo(() => computeCompleteness(profile), [profile])
  const recentJobs = (jobsQuery.data?.jobs ?? []).slice(0, 3)
  const myApplications = (profile?.applications ?? []) as Application[]
  const recentApps = myApplications.slice(0, 3)
  const activeApplications = myApplications.filter((app) => !['REJECTED', 'HIRED'].includes(app.status)).length

  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !profile) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const openDetail = (job: Job) => {
    setDetailJob(job)
    setDetailOpen(true)
  }

  const openApply = (job: Job) => {
    setApplyJob(job)
    setApplyOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">{t('seafarer.welcome')}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {t('seafarer.greeting', { name: user?.name ?? '' })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('seafarer.completeCvDesc')}</p>
        </div>
        <Button onClick={() => setView('cv')} size="lg" className="w-full sm:w-auto">
          <FileText className="size-4" />
          {pct < 80 ? t('seafarer.completeCv') : t('seafarer.viewCv')}
        </Button>
      </PageToolbar>

      <SectionCard
        title={t('seafarer.profileReadiness')}
        subtitle={t(strengthKey(pct))}
        action={<StatusPill tone={pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'danger'}>{pct}%</StatusPill>}
      >
        <Progress value={pct} className="mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileFact icon={<Anchor className="size-4" />} label={t('cv.rank')} value={safeText(profile.rank, t('common.notProvided'))} />
          <ProfileFact icon={<CheckCircle2 className="size-4" />} label={t('browse.filterAvailability')} value={<AvailabilityBadge availability={profile.availability} t={t} />} />
          <ProfileFact icon={<Globe2 className="size-4" />} label={t('browse.filterNationality')} value={safeText(profile.nationality, t('common.notProvided'))} />
          <ProfileFact icon={<UserRound className="size-4" />} label={t('browse.filterExperience')} value={formatYears(profile.yearsExperience, t('common.notProvided'))} />
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t('seafarer.openJobs')}
          value={jobsQuery.data?.total ?? '-'}
          icon={Briefcase}
          tone="primary"
          hint={t('seafarer.openJobsHint')}
        />
        <MetricCard
          label={t('seafarer.myApplications')}
          value={myApplications.length}
          icon={Send}
          tone="emerald"
          hint={t('seafarer.myApplicationsHint')}
        />
        <MetricCard
          label={t('seafarer.activeApplications')}
          value={activeApplications}
          icon={CalendarClock}
          tone="amber"
          hint={t('seafarer.activeApplicationsHint')}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <SectionCard
          title={t('seafarer.recentJobs')}
          subtitle={t('jobs.subtitle')}
          action={
            <Button variant="ghost" size="sm" onClick={() => setView('jobs')} className="text-primary hover:bg-secondary hover:text-primary">
              {t('seafarer.viewAllJobs')}
              <ArrowRight className="size-4 rtl-flip" />
            </Button>
          }
        >
          {jobsQuery.isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-44 rounded-lg" />
              <Skeleton className="h-44 rounded-lg" />
            </div>
          ) : jobsQuery.isError ? (
            <ErrorState onRetry={() => jobsQuery.refetch()} />
          ) : recentJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={t('jobs.noOpenJobs')} framed={false} />
          ) : (
            <div className="grid gap-4">
              {recentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showRecruiter
                  showApplicants
                  applicationStatus={job.myApplicationStatus}
                  onClick={() => openDetail(job)}
                  actions={
                    job.myApplicationStatus ? (
                      <Button size="sm" variant="secondary" disabled>
                        {t('seafarer.applied')}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => openApply(job)}>
                        {t('seafarer.applyNow')}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t('seafarer.recentApplications')}
          subtitle={t('seafarer.myApplicationsHint')}
          action={
            <Button variant="ghost" size="sm" onClick={() => setView('applications')} className="text-primary hover:bg-secondary hover:text-primary">
              {t('seafarer.viewAllApplications')}
              <ArrowRight className="size-4 rtl-flip" />
            </Button>
          }
        >
          {recentApps.length === 0 ? (
            <EmptyState
              icon={Send}
              title={t('seafarer.noApplications')}
              description={t('seafarer.noApplicationsDesc')}
              framed={false}
              action={
                <Button size="sm" onClick={() => setView('jobs')}>
                  <Briefcase className="size-4" />
                  {t('nav.jobs')}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {recentApps.map((app) => (
                <RecentAppRow key={app.id} app={app} />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <JobDetailDialog
        job={detailJob}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApply={(job) => {
          setDetailOpen(false)
          openApply(job)
        }}
      />
      <ApplyDialog job={applyJob} open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  )
}

function ProfileFact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function RecentAppRow({ app }: { app: Application }) {
  const { t } = useI18n()
  const status = app.status

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold">{safeText(app.job?.title, t('common.notProvided'))}</h4>
        <p className="truncate text-xs text-muted-foreground">
          {safeText(app.job?.companyName, t('common.notProvided'))}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3" />
          {t('jobs.appliedOn')} {formatDate(app.createdAt)}
        </p>
      </div>
      <StatusPill tone={statusTone[status]}>
        {t(`jobs.applicationStatus.${status}`)}
      </StatusPill>
    </li>
  )
}
