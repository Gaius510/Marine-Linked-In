'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

const statusVariant: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  REVIEWED: 'outline',
  SHORTLISTED: 'default',
  REJECTED: 'destructive',
  HIRED: 'default',
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
    <div>
      <PageHeader
        title={`${t('recruiter.welcome')}`}
        subtitle={t('recruiter.dashboardFor', { name: user?.name ?? '' })}
        action={
          <Button onClick={onPostJob} className="h-10">
            <PlusCircle className="size-4" />
            {t('recruiter.postJobCta')}
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <MetricCard label={t('recruiter.activeJobs')} value={activeJobs} icon={Briefcase} tone="primary" />
            <MetricCard label={t('recruiter.savedProfiles')} value={saved.length} icon={Bookmark} tone="amber" />
            <MetricCard label={t('recruiter.pendingInterviews')} value={pendingInterviews} icon={CalendarClock} tone="violet" />
            <MetricCard label={t('recruiter.totalApplicants')} value={applications.length} icon={Users} tone="emerald" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applicants */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t('recruiter.recentApplicants')}</h2>
            {applications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onViewAllApplicants} className="text-primary">
                {t('recruiter.viewAll')}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <EmptyState icon={Users} title={t('recruiter.noRecentApplicants')} framed={false} />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pe-1">
              {recentApps.map((app) => {
                const name = app.seafarer?.user.name ?? '—'
                const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <li key={app.id}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <Avatar className="size-9 rounded-lg bg-primary/10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => onViewProfile(app.seafarerId)}
                            className="font-medium text-sm hover:text-primary transition-colors text-start truncate"
                          >
                            {name}
                          </button>
                          <Badge variant={statusVariant[app.status]} className="shrink-0 text-[10px]">
                            {t(`jobs.applicationStatus.${app.status}`)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                          {app.seafarer?.rank && (
                            <span className="flex items-center gap-1">
                              <Anchor className="size-3" />
                              {app.seafarer.rank}
                            </span>
                          )}
                          {app.job?.title && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="truncate">{app.job.title}</span>
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
        </Card>

        {/* Upcoming interviews */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t('recruiter.upcomingInterviews')}</h2>
            {interviews.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onViewAllInterviews} className="text-primary">
                {t('recruiter.viewAll')}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title={t('recruiter.noInterviews')} framed={false} />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pe-1">
              {upcoming.map((iv) => {
                const name = iv.seafarer?.user.name ?? '—'
                const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                const dt = iv.scheduledAt ? new Date(iv.scheduledAt) : null
                return (
                  <li key={iv.id}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <Avatar className="size-9 rounded-lg bg-primary/10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{name}</div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                          {iv.job?.title && <span className="truncate">{iv.job.title}</span>}
                          {dt && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
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
        </Card>
      </div>
    </div>
  )
}
