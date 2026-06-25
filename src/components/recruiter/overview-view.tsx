'use client'

import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth-store'
import type { Application, Interview, Job, SavedProfile } from '@/lib/types'
import {
  Briefcase, Bookmark, CalendarClock, Users, PlusCircle, Anchor,
  Clock, ArrowRight, Calendar,
} from 'lucide-react'

const statusTone: Record<string, StatusTone> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'primary',
  REJECTED: 'danger',
  HIRED: 'success',
}

interface OverviewViewProps {
  onPostJob: () => void
  onViewProfile: (seafarerId: string) => void
  onViewAllApplicants: () => void
  onViewAllInterviews: () => void
}

export function OverviewView({
  onPostJob,
  onViewProfile,
  onViewAllApplicants,
  onViewAllInterviews,
}: OverviewViewProps) {
  const { t, locale } = useI18n()
  const { user } = useAuthStore()

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'mine'],
    queryFn: () => api.get<{ jobs: Job[] }>('/api/jobs?mine=1'),
  })
  const { data: appsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get<{ applications: Application[] }>('/api/applications'),
  })
  const { data: savedData } = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<{ saved: SavedProfile[] }>('/api/saved'),
  })
  const { data: interviewsData } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => api.get<{ interviews: Interview[] }>('/api/interviews'),
  })

  const jobs = jobsData?.jobs ?? []
  const applications = appsData?.applications ?? []
  const saved = savedData?.saved ?? []
  const interviews = interviewsData?.interviews ?? []

  const activeJobs = jobs.filter((j) => j.status === 'OPEN').length
  const pendingInterviews = interviews.filter((i) => i.status === 'SCHEDULED').length
  const recentApps = applications.slice(0, 5)
  const upcoming = interviews
    .filter((i) => i.status === 'SCHEDULED' && i.scheduledAt && new Date(i.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  const isLoading = !jobsData || !appsData || !savedData || !interviewsData

  return (
    <div className="space-y-6">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">{t('recruiter.dashboardFor', { name: user?.name ?? '' })}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t('recruiter.welcome')}</h1>
          </div>
        </div>
        <Button onClick={onPostJob} size="lg" className="w-full sm:w-auto">
          <PlusCircle className="size-4" />
          {t('recruiter.postJobCta')}
        </Button>
      </PageToolbar>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <MetricCard label={t('recruiter.activeJobs')} value={activeJobs} icon={Briefcase} tone="primary" />
            <MetricCard label={t('recruiter.savedProfiles')} value={saved.length} icon={Bookmark} tone="amber" />
            <MetricCard label={t('recruiter.pendingInterviews')} value={pendingInterviews} icon={CalendarClock} tone="violet" />
            <MetricCard label={t('recruiter.totalApplicants')} value={applications.length} icon={Users} tone="emerald" />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <SectionCard
          title={t('recruiter.recentApplicants')}
          subtitle={t('recruiter.recentApplicantsDesc')}
          action={
            applications.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={onViewAllApplicants} className="text-primary hover:bg-secondary hover:text-primary">
                {t('recruiter.viewAll')}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            ) : null
          }
          className="min-h-0"
          contentClassName="min-h-0"
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.75rem] w-full rounded-lg" />
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('recruiter.noRecentApplicants')}
              description={t('recruiter.recentApplicantsDesc')}
              action={
                <Button onClick={onPostJob} size="sm">
                  <PlusCircle className="size-4" />
                  {t('recruiter.postJobCta')}
                </Button>
              }
              framed={false}
              className="py-10"
            />
          ) : (
            <ul className="scrollbar-thin max-h-[28rem] divide-y divide-border/70 overflow-y-auto pe-1">
              {recentApps.map((app) => {
                const name = app.seafarer?.user.name ?? '-'
                const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <li key={app.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/70">
                      <Avatar className="size-10 shrink-0 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-secondary text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onViewProfile(app.seafarerId)}
                            className="min-w-0 truncate text-start text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {name}
                          </button>
                          <StatusPill tone={statusTone[app.status] ?? 'neutral'} className="text-[10px]">
                            {t(`jobs.applicationStatus.${app.status}`)}
                          </StatusPill>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {app.seafarer?.rank && (
                            <span className="flex items-center gap-1">
                              <Anchor className="size-3" />
                              {app.seafarer.rank}
                            </span>
                          )}
                          {app.job?.title && <span className="truncate">{app.job.title}</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={t('recruiter.upcomingInterviews')}
          subtitle={t('recruiter.upcomingInterviewsDesc')}
          action={
            interviews.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={onViewAllInterviews} className="text-primary hover:bg-secondary hover:text-primary">
                {t('recruiter.viewAll')}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            ) : null
          }
          className="min-h-0"
          contentClassName="min-h-0"
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.75rem] w-full rounded-lg" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={t('recruiter.noInterviews')}
              description={t('recruiter.upcomingInterviewsDesc')}
              framed={false}
              className="py-10"
            />
          ) : (
            <ul className="scrollbar-thin max-h-[28rem] divide-y divide-border/70 overflow-y-auto pe-1">
              {upcoming.map((iv) => {
                const name = iv.seafarer?.user.name ?? '-'
                const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                const dt = iv.scheduledAt ? new Date(iv.scheduledAt) : null
                return (
                  <li key={iv.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/70">
                      <Avatar className="size-10 shrink-0 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-secondary text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {iv.job?.title && <span className="truncate">{iv.job.title}</span>}
                          {dt && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {dt.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
