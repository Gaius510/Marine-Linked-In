'use client'

import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { Application, ApplicationStatus } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Briefcase, CalendarClock, Building2, MapPin } from 'lucide-react'

const statusTone: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  REVIEWED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  HIRED: 'bg-primary/10 text-primary border-primary/20',
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
        <Card className="p-10 text-center">
          <Send className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t('seafarer.noApplications')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('seafarer.noApplicationsDesc')}</p>
          <Button onClick={() => setView('jobs')} className="mt-4">
            <Briefcase className="size-4" />
            {t('nav.jobs')}
          </Button>
        </Card>
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
  const fmtDate = (d: string) => new Date(d).toLocaleDateString()
  const status = app.status
  const job = app.job

  return (
    <li className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold truncate">{job?.title ?? '—'}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {job?.companyName ?? '—'}
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
              {t('jobs.appliedOn')} {fmtDate(app.createdAt)}
            </p>
            {app.message && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                “{app.message}”
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 self-start sm:self-center ${statusTone[status]}`}>
          {t(`jobs.applicationStatus.${status}`)}
        </Badge>
      </div>
    </li>
  )
}
