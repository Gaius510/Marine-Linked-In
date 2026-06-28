'use client'

import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
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
  Anchor, ArrowRight, Briefcase, Bookmark, Calendar, CalendarClock,
  Clock, Mail, PlusCircle, Search, Ship, Users,
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
  onBrowseSeafarers: () => void
  onManageJobs: () => void
  onViewMessages: () => void
  onViewProfile: (seafarerId: string) => void
  onViewAllApplicants: () => void
  onViewAllInterviews: () => void
}

export function OverviewView({
  onPostJob,
  onBrowseSeafarers,
  onManageJobs,
  onViewMessages,
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
  const openJobs = jobs.filter((j) => j.status === 'OPEN').slice(0, 4)
  const pendingInterviews = interviews.filter((i) => i.status === 'SCHEDULED').length
  const recentApps = applications.slice(0, 5)
  const upcoming = interviews
    .filter((i) => i.status === 'SCHEDULED' && i.scheduledAt && new Date(i.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 6)

  const isLoading = !jobsData || !appsData || !savedData || !interviewsData

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <div className="min-w-0 p-4 sm:p-5 lg:p-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Briefcase className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">
                  {t('recruiter.dashboardFor', { name: user?.name ?? '' })}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t('recruiter.welcome')}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('browse.subtitle')}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SummaryTile label={t('recruiter.activeJobs')} value={activeJobs} icon={Briefcase} />
              <SummaryTile label={t('recruiter.totalApplicants')} value={applications.length} icon={Users} />
              <SummaryTile label={t('recruiter.pendingInterviews')} value={pendingInterviews} icon={CalendarClock} />
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-secondary/75 via-card to-secondary/80 p-4 dark:from-secondary/35 dark:via-card dark:to-primary/10 sm:p-5 xl:border-s xl:border-t-0">
            <div className="space-y-3">
              <Button onClick={onBrowseSeafarers} size="lg" className="h-11 w-full justify-start">
                <Search className="size-4" />
                {t('recruiter.browseSeafarersCta')}
              </Button>
              <Button onClick={onPostJob} size="lg" variant="secondary" className="h-11 w-full justify-start">
                <PlusCircle className="size-4" />
                {t('recruiter.postJobCta')}
              </Button>
              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <Button variant="outline" className="justify-start bg-background/65" onClick={onManageJobs}>
                  <Briefcase className="size-4" />
                  {t('nav.myJobs')}
                </Button>
                <Button variant="outline" className="justify-start bg-background/65" onClick={onViewAllInterviews}>
                  <CalendarClock className="size-4" />
                  {t('nav.interviews')}
                </Button>
                <Button variant="outline" className="justify-start bg-background/65" onClick={onViewMessages}>
                  <Mail className="size-4" />
                  {t('nav.messages')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard
          title={t('recruiter.myJobPostings')}
          subtitle={t('jobs.managementSummary', { count: jobs.length })}
          action={
            jobs.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={onManageJobs} className="text-primary hover:bg-secondary hover:text-primary">
                {t('recruiter.viewAll')}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            ) : null
          }
          className="min-h-0"
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.75rem] w-full rounded-lg" />
              ))}
            </div>
          ) : openJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('recruiter.noJobs')}
              description={t('jobs.noJobsHelp')}
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
            <ul className="space-y-3">
              {openJobs.map((job) => (
                <li key={job.id} className="rounded-lg border border-border/70 bg-background/65 p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold">{job.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {job.rank && (
                          <span className="flex min-w-0 items-center gap-1 font-medium text-foreground">
                            <Anchor className="size-3" />
                            <span className="truncate">{job.rank}</span>
                          </span>
                        )}
                        {job.vesselType && (
                          <span className="flex min-w-0 items-center gap-1">
                            <Ship className="size-3" />
                            <span className="truncate">{job.vesselType}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusPill tone="success" className="shrink-0 text-[10px]">
                      {t('jobs.applicantsCount', { count: job._count?.applications ?? 0 })}
                    </StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

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
                            className="min-w-0 cursor-pointer truncate rounded-sm text-start text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      </div>

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
      >
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[5.25rem] w-full rounded-lg" />
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((iv) => {
              const name = iv.seafarer?.user.name ?? '-'
              const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              const dt = iv.scheduledAt ? new Date(iv.scheduledAt) : null
              return (
                <div key={iv.id} className="rounded-lg border border-border/70 bg-background/65 p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-secondary text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onViewProfile(iv.seafarerId)}
                        className="max-w-full cursor-pointer truncate rounded-sm text-start text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {name}
                      </button>
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
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/65 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  )
}
