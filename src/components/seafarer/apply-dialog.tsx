'use client'

import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Job, ApplicationStatus } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'

interface ApplyDialogProps {
  job: Job | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

const statusTone: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  REVIEWED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  HIRED: 'bg-primary/10 text-primary border-primary/20',
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setMessage('')
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5 text-primary" />
            {t('jobs.apply')}
          </DialogTitle>
          <DialogDescription className="text-start">
            <span className="font-medium text-foreground">{job.title}</span>
            {' · '}
            <span>{job.companyName}</span>
          </DialogDescription>
        </DialogHeader>

        {alreadyApplied ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{t('jobs.alreadyApplied')}</span>
            </div>
            {job.myApplicationStatus && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('common.status')}:</span>
                <Badge variant="outline" className={statusTone[job.myApplicationStatus]}>
                  {t(`jobs.applicationStatus.${job.myApplicationStatus}`)}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="apply-message">{t('jobs.applyMessage')}</Label>
              <Textarea
                id="apply-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="…"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {t('seafarer.applyNow')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
