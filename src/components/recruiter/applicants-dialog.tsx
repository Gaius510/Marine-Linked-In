'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Application, ApplicationStatus } from '@/lib/types'
import { Anchor, Calendar, Inbox } from 'lucide-react'

const APP_STATUSES: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED']

const statusVariant: Record<ApplicationStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  REVIEWED: 'outline',
  SHORTLISTED: 'default',
  REJECTED: 'destructive',
  HIRED: 'default',
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

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'job', job?.id],
    queryFn: () => api.get<{ applications: Application[] }>(`/api/applications?jobId=${job?.id}`),
    enabled: !!job,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.put(`/api/applications/${id}?id=${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications', 'job', job?.id] })
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{job ? t('jobs.applicantsFor', { title: job.title }) : ''}</DialogTitle>
          <DialogDescription>
            {data?.applications.length ?? 0} {t('jobs.applicants')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !data?.applications.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Inbox className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">{t('jobs.noApplicantsForJob')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.applications.map((app) => {
              const name = app.seafarer?.user.name ?? '—'
              const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Card key={app.id} className="p-4 shadow-none">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 rounded-xl bg-primary/10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold rounded-xl text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button
                            onClick={() => onViewProfile?.(app.seafarerId)}
                            className="font-medium text-sm hover:text-primary transition-colors text-start truncate block max-w-full"
                          >
                            {name}
                          </button>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {app.seafarer?.rank && (
                              <span className="flex items-center gap-1">
                                <Anchor className="size-3" />
                                {app.seafarer.rank}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant={statusVariant[app.status]}>
                          {t(`jobs.applicationStatus.${app.status}`)}
                        </Badge>
                      </div>

                      {app.message && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                          “{app.message}”
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProfile?.(app.seafarerId)}
                        >
                          {t('common.viewProfile')}
                        </Button>
                        <Select
                          value={app.status}
                          onValueChange={(v) =>
                            statusMutation.mutate({ id: app.id, status: v as ApplicationStatus })
                          }
                        >
                          <SelectTrigger size="sm" className="w-40 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APP_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(`jobs.applicationStatus.${s}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
