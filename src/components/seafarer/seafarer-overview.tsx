'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Job, ApplicationStatus, Application } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusPill } from '@/components/shared/status-pill'
import { JobCard } from '@/components/shared/job-card'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { ApplyDialog } from '@/components/seafarer/apply-dialog'
import { computeCompleteness, strengthKey } from '@/components/seafarer/profile-completeness'
import { formatDate } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, Send, ArrowRight, FileText, Anchor, CalendarClock } from 'lucide-react'

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
  const { data, isLoading } = useSeafarerProfile()

  const jobsQuery = useQuery<JobsResponse>({
    queryKey: ['jobs', 'overview'],
    queryFn: () => api.get<JobsResponse>('/api/jobs'),
  })

  const profile = data?.profile
  const pct = useMemo(() => computeCompleteness(profile), [profile])
  const recentJobs = (jobsQuery.data?.jobs ?? []).slice(0, 3)
  const myApplications = (profile?.applications ?? []) as Application[]
  const recentApps = myApplications.slice(0, 3)

  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const openApply = (job: Job) => {
    setApplyJob(job)
    setApplyOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('seafarer.greeting', { name: user?.name ?? '' })}
        subtitle={t('seafarer.completeCvDesc')}
        icon={<Anchor className="size-5" />}
      />

      {/* CV completeness card */}
      <Card className="p-5 sm:p-6 maritime-gradient-soft">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h3 className="font-semibold">{t('seafarer.cvProgress')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t(strengthKey(pct))}</p>
            <Progress value={pct} className="mt-3 max-w-md" />
            <div className="flex items-center gap-2 mt-3 text-sm">
              <AvailabilityBadge availability={profile.availability} t={t} />
              {profile.rank && <Badge variant="outline">{profile.rank}</Badge>}
              {profile.nationality && <Badge variant="outline">{profile.nationality}</Badge>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button onClick={() => setView('cv')} className="w-full sm:w-auto">
              <FileText className="size-4" /> {t('seafarer.editCv')}
            </Button>
            <Button onClick={() => setView('cv')} variant="outline" className="w-full sm:w-auto">
              {t('seafarer.viewCv')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stat row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <MetricCard
          label={t('seafarer.openJobs')}
          value={jobsQuery.data?.total ?? '—'}
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
      </div>

      {/* Recent jobs preview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="size-5 text-primary" />
            {t('seafarer.recentJobs')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setView('jobs')} className="gap-1">
            {t('seafarer.viewAllJobs')}
            <ArrowRight className="size-4 rtl-flip" />
          </Button>
        </div>

        {jobsQuery.isLoading ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : recentJobs.length === 0 ? (
          <EmptyState icon={Briefcase} title={t('jobs.noOpenJobs')} />
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showRecruiter
                showApplicants
                onClick={() => openApply(job)}
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
      </section>

      {/* Recent applications */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send className="size-5 text-primary" />
            {t('seafarer.recentApplications')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setView('applications')} className="gap-1">
            {t('seafarer.viewAllApplications')}
            <ArrowRight className="size-4 rtl-flip" />
          </Button>
        </div>

        {recentApps.length === 0 ? (
          <EmptyState
            icon={Send}
            title={t('seafarer.noApplications')}
            description={t('seafarer.noApplicationsDesc')}
          />
        ) : (
          <Card className="p-2 sm:p-3 divide-y">
            {recentApps.map((app) => (
              <RecentAppRow key={app.id} app={app} />
            ))}
          </Card>
        )}
      </section>

      <ApplyDialog job={applyJob} open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  )
}

function RecentAppRow({ app }: { app: Application }) {
  const { t } = useI18n()
  const status = app.status

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <h4 className="font-medium truncate">{app.job?.title ?? '—'}</h4>
        <p className="text-xs text-muted-foreground truncate">
          {app.job?.companyName}
          {app.job?.recruiter?.company ? ` · ${app.job.recruiter.company}` : ''}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <CalendarClock className="size-3" />
          {t('jobs.appliedOn')} {formatDate(app.createdAt)}
        </p>
      </div>
      <StatusPill tone={statusTone[status]}>
        {t(`jobs.applicationStatus.${status}`)}
      </StatusPill>
    </div>
  )
}
