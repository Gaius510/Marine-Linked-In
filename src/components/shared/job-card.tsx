'use client'

import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/shared/status-pill'
import { formatDate, formatSalaryRange, safeText } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ApplicationStatus, Job } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface JobCardProps {
  job: Job
  actions?: React.ReactNode
  onClick?: () => void
  showApplicants?: boolean
  showStatus?: boolean
  showRecruiter?: boolean
  applicationStatus?: ApplicationStatus | null
}

const applicationTone: Record<ApplicationStatus, 'warning' | 'info' | 'success' | 'danger' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
}

export function JobCard({ job, actions, onClick, showApplicants, showStatus, showRecruiter, applicationStatus }: JobCardProps) {
  const { t } = useI18n()
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.currency, '')
  const applicantsCount = job._count?.applications ?? 0

  return (
    <Card
      className={cn(
        'flex h-full min-w-0 flex-col p-3 sm:p-4',
        (onClick || actions) && 'hover:border-primary/35'
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="line-clamp-2 text-start text-base font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
          >
            {job.title}
          </button>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">{safeText(job.companyName)}</div>
        </div>
        {showStatus && (
          <StatusPill tone={job.status === 'OPEN' ? 'success' : 'neutral'}>
            {job.status === 'OPEN' ? t('jobs.open') : t('jobs.closed')}
          </StatusPill>
        )}
        {applicationStatus && (
          <StatusPill tone={applicationTone[applicationStatus]}>
            {t(`jobs.applicationStatus.${applicationStatus}`)}
          </StatusPill>
        )}
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground [&>span:not(:last-child)]:after:ms-2 [&>span:not(:last-child)]:after:content-['·']">
        {job.rank && <span className="font-medium text-foreground">{job.rank}</span>}
        {job.vesselType && <span className="min-w-0 truncate">{job.vesselType}</span>}
        {job.location && <span className="min-w-0 truncate">{job.location}</span>}
        {salary && <span className="min-w-0 truncate">{salary}</span>}
        {job.contractDuration && <span className="min-w-0 truncate">{job.contractDuration}</span>}
        {job.joiningDate && <span>{formatDate(job.joiningDate)}</span>}
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p>}

      {showRecruiter && job.recruiter && (
        <div className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          {t('jobs.postedBy')} <span className="font-medium text-foreground">{job.recruiter.name}</span>
          {job.recruiter.company && ` · ${job.recruiter.company}`}
        </div>
      )}

      <div className="mt-auto flex min-w-0 flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {showApplicants ? (
          <div className="truncate text-xs text-muted-foreground">{t('jobs.applicantsCount', { count: applicantsCount })}</div>
        ) : (
          <div />
        )}
        {actions && (
          <div className="flex min-w-0 flex-wrap items-stretch gap-2 sm:justify-end [&>[data-slot=button]]:min-w-0 [&>[data-slot=button]]:flex-1 sm:[&>[data-slot=button]]:flex-none">
            {actions}
          </div>
        )}
      </div>
    </Card>
  )
}
