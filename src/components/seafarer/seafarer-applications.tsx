'use client'

import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { Application, ApplicationStatus } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusPill } from '@/components/shared/status-pill'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, safeText } from '@/lib/format'
import { Send, Briefcase, CalendarClock, Building2, MapPin } from 'lucide-react'

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
  const { data, isLoading } = useSeafarerProfile()
  const applications = (data?.profile?.applications ?? []) as Application[]

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('seafarer.myApplications')}
        subtitle={t('seafarer.myApplicationsHint')}
        icon={<Send className="size-5" />}
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
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
        <Card className="p-2 sm:p-3">
          <ul className="divide-y">
            {applications.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function ApplicationRow({ app }: { app: Application }) {
  const { t } = useI18n()
  const status = app.status
  const job = app.job

  return (
    <li className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold truncate">{safeText(job?.title)}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {safeText(job?.companyName)}
              </span>
              {job?.rank && <span>· {job.rank}</span>}
              {job?.vesselType && <span>· {job.vesselType}</span>}
              {job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {job.location}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarClock className="size-3" />
              {t('jobs.appliedOn')} {formatDate(app.createdAt)}
            </p>
            {app.message && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                “{app.message}”
              </p>
            )}
          </div>
        </div>
        <StatusPill tone={statusTone[status]} className="self-start sm:self-center">
          {t(`jobs.applicationStatus.${status}`)}
        </StatusPill>
      </div>
    </li>
  )
}
