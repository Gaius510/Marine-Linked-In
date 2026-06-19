'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const salary = job.salaryMin || job.salaryMax
    ? `${job.salaryMin || '?'} - ${job.salaryMax || '?'} ${job.currency}`
    : null

  return (
    <Card className="p-4 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            onClick={onClick}
            disabled={!onClick}
            className="font-semibold text-base hover:text-primary transition-colors text-start line-clamp-2 disabled:cursor-default"
          >
            {job.title}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" />
              {job.companyName}
            </span>
          </div>
        </div>
        {showStatus && (
          <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'} className="shrink-0">
            {job.status === 'OPEN' ? t('jobs.open') : t('jobs.closed')}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground mt-3">
        {job.rank && (
          <span className="flex items-center gap-1">
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
            {job.joiningDate}
          </span>
        )}
      </div>

      {job.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{job.description}</p>}

      {showRecruiter && job.recruiter && (
        <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
          {t('jobs.postedBy')} <span className="font-medium text-foreground">{job.recruiter.name}</span>
          {job.recruiter.company && ` · ${job.recruiter.company}`}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-3">
        {showApplicants ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {job._count?.applications ?? 0} {t('jobs.applicants')}
          </div>
        ) : (
          <div />
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </Card>
  )
}
