'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import { api } from '@/lib/api'
import { formatDate, formatYears, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Application, ApplicationStatus } from '@/lib/types'
import { Anchor, Calendar, Clock, Eye, Inbox, UserRound } from 'lucide-react'

const APP_STATUSES: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED']

const statusTone: Record<ApplicationStatus, StatusTone> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'primary',
  REJECTED: 'danger',
  HIRED: 'success',
}

interface ApplicantsDialogProps {
  job: { id: string; title: string } | null
  onOpenChange: (open: boolean) => void
  onViewProfile?: (seafarerId: string) => void
}

export function ApplicantsDialog({ job, onOpenChange, onViewProfile }: ApplicantsDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const open = !!job

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications', 'job', job?.id],
    queryFn: () => api.get<{ applications: Application[] }>(`/api/applications?jobId=${job?.id}`),
    enabled: !!job,
  })

  const applications = data?.applications ?? []

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.put(`/api/applications/${id}?id=${id}`, { status }),
    onSuccess: () => {
      toast.success(t('jobs.applicationStatusUpdated'))
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications', 'job', job?.id] })
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[min(58rem,calc(100vw-2rem))]">
        <DialogHeader className="border-b border-border/70 bg-card/95 px-5 py-4 pe-12 text-start">
          <DialogTitle>{job ? t('jobs.applicantsFor', { title: job.title }) : t('jobs.viewApplicants')}</DialogTitle>
          <DialogDescription>
            {isLoading ? t('common.loading') : t('jobs.applicantsCount', { count: applications.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : applications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={t('jobs.noApplicantsForJob')}
              description={t('jobs.noApplicantsForJobHelp')}
              framed={false}
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicantItem
                  key={app.id}
                  application={app}
                  updating={statusMutation.isPending}
                  onStatusChange={(status) => statusMutation.mutate({ id: app.id, status })}
                  onViewProfile={onViewProfile}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ApplicantItem({
  application,
  updating,
  onStatusChange,
  onViewProfile,
  t,
}: {
  application: Application
  updating: boolean
  onStatusChange: (status: ApplicationStatus) => void
  onViewProfile?: (seafarerId: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const name = application.seafarer?.user.name ?? '-'
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const seafarer = application.seafarer

  return (
    <SectionCard className="p-4" contentClassName="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Avatar className="size-11 shrink-0 rounded-xl">
          <AvatarFallback className="rounded-xl bg-secondary text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewProfile?.(application.seafarerId)}
                disabled={!onViewProfile}
                className="block max-w-full truncate rounded-sm text-start text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default enabled:cursor-pointer"
              >
                {name}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {seafarer?.rank && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Anchor className="size-3.5" />
                    {seafarer.rank}
                  </span>
                )}
                {seafarer?.yearsExperience && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatYears(seafarer.yearsExperience)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {t('jobs.appliedOn')} {formatDate(application.createdAt)}
                </span>
              </div>
            </div>
            <StatusPill tone={statusTone[application.status]}>
              {t(`jobs.applicationStatus.${application.status}`)}
            </StatusPill>
          </div>

          <div className="mt-3 rounded-lg border border-border/60 bg-muted/35 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
              <UserRound className="size-3.5" />
              {t('jobs.candidateSummary')}
            </div>
            <p className="line-clamp-3 leading-6">
              {safeText(seafarer?.bio || application.message || application.coverLetter, t('common.notProvided'))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onViewProfile?.(application.seafarerId)}
          disabled={!onViewProfile}
        >
          <Eye className="size-4" />
          {t('common.viewProfile')}
        </Button>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">{t('jobs.changeStatus')}</span>
          <Select
            value={application.status}
            onValueChange={(value) => onStatusChange(value as ApplicationStatus)}
            disabled={updating}
          >
            <SelectTrigger size="sm" className="h-8 w-full sm:w-44" aria-label={t('jobs.changeStatus')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`jobs.applicationStatus.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </SectionCard>
  )
}
