'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import { api } from '@/lib/api'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Interview, InterviewStatus } from '@/lib/types'
import {
  CalendarClock, Calendar, Clock, MapPin, Check, X as XIcon, Briefcase, FileText, Eye,
} from 'lucide-react'

const statusTone: Record<InterviewStatus, StatusTone> = {
  SCHEDULED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export function InterviewsView({ onViewProfile }: { onViewProfile?: (seafarerId: string) => void }) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => api.get<{ interviews: Interview[] }>('/api/interviews'),
  })

  const interviews = (data?.interviews ?? []).slice().sort((a, b) => {
    const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
    const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
    return at - bt
  })

  const summary = interviews.reduce(
    (acc, interview) => {
      acc[interview.status] += 1
      return acc
    },
    { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 } as Record<InterviewStatus, number>
  )

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InterviewStatus }) =>
      api.put(`/api/interviews/${id}?id=${id}`, { status }),
    onSuccess: () => {
      toast.success(t('interview.statusUpdated'))
      qc.invalidateQueries({ queryKey: ['interviews'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const now = Date.now()

  return (
    <div className="space-y-4">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t('interview.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? t('common.loading') : t('interview.summary', { count: interviews.length })}
          </p>
          {!isLoading && interviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="warning">{t('interview.scheduledCount', { count: summary.SCHEDULED })}</StatusPill>
              <StatusPill tone="success">{t('interview.completedCount', { count: summary.COMPLETED })}</StatusPill>
              <StatusPill tone="danger">{t('interview.cancelledCount', { count: summary.CANCELLED })}</StatusPill>
            </div>
          )}
        </div>
      </PageToolbar>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('interview.empty')}
          description={t('interview.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <InterviewItem
              key={interview.id}
              interview={interview}
              now={now}
              updating={updateMutation.isPending}
              onUpdateStatus={(status) => updateMutation.mutate({ id: interview.id, status })}
              onViewProfile={onViewProfile}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InterviewItem({
  interview,
  now,
  updating,
  onUpdateStatus,
  onViewProfile,
  t,
}: {
  interview: Interview
  now: number
  updating: boolean
  onUpdateStatus: (status: InterviewStatus) => void
  onViewProfile?: (seafarerId: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const name = interview.seafarer?.user.name ?? '-'
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const scheduledAt = interview.scheduledAt ? new Date(interview.scheduledAt) : null
  const isUpcoming = scheduledAt ? scheduledAt.getTime() >= now : false
  const isScheduled = interview.status === 'SCHEDULED'
  const time = scheduledAt
    ? scheduledAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null

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
                onClick={() => onViewProfile?.(interview.seafarerId)}
                disabled={!onViewProfile}
                className="block max-w-full truncate rounded-sm text-start text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default enabled:cursor-pointer"
              >
                {name}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {safeText(interview.job?.title, t('interview.noPosition'))}
                </span>
                {scheduledAt && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {formatDate(scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {time}
                    </span>
                  </>
                )}
                {interview.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {interview.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <StatusPill tone={statusTone[interview.status]}>
                {t(`interview.status.${interview.status}`)}
              </StatusPill>
              {isScheduled && (
                <StatusPill tone={isUpcoming ? 'primary' : 'neutral'}>
                  {isUpcoming ? t('interview.upcoming') : t('interview.past')}
                </StatusPill>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-muted/45 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
              <FileText className="size-3.5" />
              {t('interview.notes')}
            </div>
            <p className="line-clamp-3 leading-6">
              {safeText(interview.notes, t('interview.noNotes'))}
            </p>
          </div>
        </div>
      </div>

      {isScheduled && (
        <div className="flex min-w-0 flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:justify-end [&>[data-slot=button]]:min-w-0">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onViewProfile?.(interview.seafarerId)}
            disabled={!onViewProfile}
          >
            <Eye className="size-4" />
            {t('common.viewProfile')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onUpdateStatus('COMPLETED')}
            disabled={updating}
          >
            <Check className="size-4" />
            {t('interview.markComplete')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
            onClick={() => onUpdateStatus('CANCELLED')}
            disabled={updating}
          >
            <XIcon className="size-4" />
            {t('interview.cancel')}
          </Button>
        </div>
      )}
      {!isScheduled && onViewProfile && (
        <div className="flex justify-end border-t border-border/70 pt-3">
          <Button size="sm" className="w-full sm:w-auto" onClick={() => onViewProfile(interview.seafarerId)}>
            <Eye className="size-4" />
            {t('common.viewProfile')}
          </Button>
        </div>
      )}
    </SectionCard>
  )
}
