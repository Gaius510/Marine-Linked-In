'use client'

import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { ApplicationStatus, Job } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { formatDate, formatSalaryRange, safeText } from '@/lib/format'
import { Briefcase, Building2, CheckCircle2, Clock, Loader2, Send, Ship, Wallet } from 'lucide-react'

interface ApplyDialogProps {
  job: Job | null
  open: boolean
  onOpenChange: (value: boolean) => void
}

const statusTone: Record<ApplicationStatus, 'warning' | 'info' | 'success' | 'danger' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
}

export function ApplyDialog({ job, open, onOpenChange }: ApplyDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [message, setMessage] = useState('')

  const alreadyApplied = !!job?.myApplicationStatus

  const mutation = useMutation({
    mutationFn: () => api.post<{ application: unknown }>('/api/applications', {
      jobId: job?.id,
      message: message.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success(t('jobs.applySuccess'))
      setMessage('')
      onOpenChange(false)
    },
    onError: (err: Error) => {
      if (err.message === 'already_applied') {
        toast.error(t('jobs.alreadyApplied'))
      } else {
        toast.error(t('common.error'))
      }
    },
  })

  if (!job) return null

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setMessage('')
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5 text-primary" />
            {t('jobs.apply')}
          </DialogTitle>
          <DialogDescription>{t('jobs.applyDialogDesc')}</DialogDescription>
        </DialogHeader>

        <SectionCard className="p-4" contentClassName="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Briefcase className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold">{job.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {safeText(job.companyName)}
                </span>
                {job.rank && <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{job.rank}</span>}
                {job.vesselType && <span className="flex items-center gap-1"><Ship className="size-3.5" />{job.vesselType}</span>}
                {(job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1">
                    <Wallet className="size-3.5" />
                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                )}
                {job.joiningDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatDate(job.joiningDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {alreadyApplied ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{t('jobs.alreadyApplied')}</span>
            </div>
            {job.myApplicationStatus && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('common.status')}:</span>
                <StatusPill tone={statusTone[job.myApplicationStatus]}>
                  {t(`jobs.applicationStatus.${job.myApplicationStatus}`)}
                </StatusPill>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (mutation.isPending) return
              mutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="apply-message">
                {t('jobs.applyMessage')} <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Textarea
                id="apply-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder={t('jobs.applyMessagePlaceholder')}
                disabled={mutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{t('jobs.applyMessageHelp')}</p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {mutation.isPending ? t('jobs.applying') : t('seafarer.applyNow')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
