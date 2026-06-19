'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Interview, InterviewStatus } from '@/lib/types'
import {
  CalendarClock, Calendar, Clock, MapPin, Check, X as XIcon,
} from 'lucide-react'

const statusVariant: Record<InterviewStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SCHEDULED: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
}

export function InterviewsView() {
  const { t, locale } = useI18n()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => api.get<{ interviews: Interview[] }>('/api/interviews'),
  })

  const interviews = (data?.interviews ?? []).slice().sort((a, b) => {
    const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
    const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
    return at - bt
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InterviewStatus }) =>
      api.put(`/api/interviews/${id}?id=${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const now = Date.now()

  return (
    <div>
      <PageHeader
        title={t('interview.title')}
        subtitle={t('interview.subtitle')}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <CalendarClock className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t('interview.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const name = iv.seafarer?.user.name ?? '—'
            const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
            const dt = iv.scheduledAt ? new Date(iv.scheduledAt) : null
            const isUpcoming = dt ? dt.getTime() >= now : false
            const isScheduled = iv.status === 'SCHEDULED'
            return (
              <Card key={iv.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Avatar className="size-11 rounded-xl bg-primary/10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold rounded-xl text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm truncate">{name}</span>
                      <Badge variant={statusVariant[iv.status]} className="text-[11px]">
                        {t(`interview.status.${iv.status}`)}
                      </Badge>
                      {isScheduled && (
                        <Badge variant="outline" className="text-[11px]">
                          {isUpcoming ? t('interview.upcoming') : t('interview.past')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 truncate max-w-32">
                        {iv.job?.title ?? t('interview.noPosition')}
                      </span>
                      {dt && (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {dt.toLocaleDateString(locale, { dateStyle: 'medium' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                      {iv.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {iv.location}
                        </span>
                      )}
                    </div>
                    {iv.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                        {iv.notes}
                      </p>
                    )}
                  </div>
                  {isScheduled && (
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => updateMutation.mutate({ id: iv.id, status: 'COMPLETED' })}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="size-4" />
                        {t('interview.markComplete')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => updateMutation.mutate({ id: iv.id, status: 'CANCELLED' })}
                        disabled={updateMutation.isPending}
                      >
                        <XIcon className="size-4" />
                        {t('common.cancel')}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
