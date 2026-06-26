'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/field-error'
import { StatusPill } from '@/components/shared/status-pill'
import { api } from '@/lib/api'
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { useI18n } from '@/lib/i18n'
import { interviewCreateSchema, type InterviewCreateInput } from '@/lib/validation/interviews'
import { toast } from 'sonner'
import { CalendarClock, Loader2, MapPin, UserRound } from 'lucide-react'

interface ScheduleInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seafarerId: string | null
  seafarerName?: string
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  seafarerId,
  seafarerName,
}: ScheduleInterviewDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: (payload: InterviewCreateInput) => api.post('/api/interviews', payload),
    onSuccess: () => {
      toast.success(t('interview.scheduleSuccess'))
      qc.invalidateQueries({ queryKey: ['interviews'] })
      onOpenChange(false)
      setScheduledAt('')
      setLocation('')
      setNotes('')
      setFieldErrors({})
    },
    onError: (err: Error) => {
      const fields = apiFieldErrors(err)
      if (fields) {
        setFieldErrors(fields)
        focusFirstInvalid(fields, { scheduledAt: 'int-datetime', location: 'int-location', notes: 'int-notes' })
        return
      }
      toast.error(t('common.error'))
      console.error(err)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    const result = validateFields(interviewCreateSchema, {
      seafarerId,
      scheduledAt,
      location: location || undefined,
      notes: notes || undefined,
    })
    if (result.errors) {
      setFieldErrors(result.errors)
      focusFirstInvalid(result.errors, { scheduledAt: 'int-datetime', location: 'int-location', notes: 'int-notes' })
      return
    }
    mutation.mutate({
      ...result.data,
      scheduledAt: new Date(result.data.scheduledAt).toISOString(),
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setFieldErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('interview.scheduleTitle')}</DialogTitle>
          <DialogDescription>
            {seafarerName
              ? t('browse.scheduleFor', { name: seafarerName })
              : t('interview.scheduleTitle')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border/80 bg-secondary/45 p-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                <UserRound className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{t('interview.candidate')}</div>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                  {seafarerName ?? t('interview.candidate')}
                </div>
              </div>
              <StatusPill tone="warning" className="gap-1">
                <CalendarClock className="size-3.5" />
                {t('interview.status.SCHEDULED')}
              </StatusPill>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="int-datetime">{t('interview.scheduledAtLabel')}</Label>
            <Input
              id="int-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => {
                setScheduledAt(e.target.value)
                setFieldErrors((current) => ({ ...current, scheduledAt: '' }))
              }}
              aria-invalid={!!fieldErrors.scheduledAt}
              aria-describedby={fieldErrors.scheduledAt ? 'int-datetime-error' : undefined}
            />
            <FieldError id="int-datetime-error" code={fieldErrors.scheduledAt} t={t} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-location">{t('interview.locationLabel')}</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="int-location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setFieldErrors((current) => ({ ...current, location: '' }))
                }}
                placeholder="Rotterdam / Zoom / Phone"
                className="ps-9"
                aria-invalid={!!fieldErrors.location}
                aria-describedby={fieldErrors.location ? 'int-location-error' : undefined}
              />
            </div>
            <FieldError id="int-location-error" code={fieldErrors.location} t={t} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-notes">{t('interview.notesLabel')}</Label>
            <Textarea
              id="int-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setFieldErrors((current) => ({ ...current, notes: '' }))
              }}
              rows={3}
              aria-invalid={!!fieldErrors.notes}
              aria-describedby={fieldErrors.notes ? 'int-notes-error' : undefined}
            />
            <FieldError id="int-notes-error" code={fieldErrors.notes} t={t} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !scheduledAt}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('interview.scheduling')}
                </>
              ) : (
                t('interview.scheduleCta')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
