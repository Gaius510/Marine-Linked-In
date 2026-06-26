'use client'

import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/shared/status-pill'
import { formatCurrency, formatDate, safeText } from '@/lib/format'
import { Briefcase, MapPin, Wallet, CalendarClock, Clock, Building2, Users } from 'lucide-react'
import type { Job } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface JobCardProps {
  job: Job
  actions?: React.ReactNode
  onClick?: () => void
  showApplicants?: boolean
  showStatus?: boolean
  showRecruiter?: boolean
}

export function JobCard({ job, actions, onClick, showApplicants, showStatus, showRecruiter }: JobCardProps) {
  const { t } = useI18n()
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency)
  const applicantsCount = job._count?.applications ?? 0

  return (
    <Card className="flex h-full flex-col p-4 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="line-clamp-2 text-start text-base font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
          >
            {job.title}
          </button>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" />
              {safeText(job.companyName)}
            </span>
          </div>
        </div>
        {showStatus && (
          <StatusPill tone={job.status === 'OPEN' ? 'success' : 'neutral'}>
            {job.status === 'OPEN' ? t('jobs.open') : t('jobs.closed')}
          </StatusPill>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {job.rank && (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Briefcase className="size-3.5" />
            {job.rank}
          </span>
        )}
        {job.vesselType && <span>{job.vesselType}</span>}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1">
            <Wallet className="size-3.5" />
            {salary}
          </span>
        )}
        {job.contractDuration && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {job.contractDuration}
          </span>
        )}
        {job.joiningDate && (
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {formatDate(job.joiningDate)}
          </span>
        )}
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p>}

      {showRecruiter && job.recruiter && (
        <div className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          {t('jobs.postedBy')} <span className="font-medium text-foreground">{job.recruiter.name}</span>
          {job.recruiter.company && ` · ${job.recruiter.company}`}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        {showApplicants ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {t('jobs.applicantsCount', { count: applicantsCount })}
          </div>
        ) : (
          <div />
        )}
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
    </Card>
  )
}

function formatSalary(min: string | null, max: string | null, currency: string) {
  if (!min && !max) return null
  if (min && max) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
  return min ? formatCurrency(min, currency) : formatCurrency(max, currency)
}
