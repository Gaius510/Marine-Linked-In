'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/interviews', {
        seafarerId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success(t('interview.scheduleSuccess'))
      qc.invalidateQueries({ queryKey: ['interviews'] })
      onOpenChange(false)
      setScheduledAt('')
      setLocation('')
      setNotes('')
    },
    onError: (err: Error) => {
      toast.error(t('common.error'))
      console.error(err)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduledAt || !seafarerId) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('interview.scheduleTitle')}</DialogTitle>
          <DialogDescription>
            {seafarerName
              ? t('browse.scheduleFor', { name: seafarerName })
              : t('interview.scheduleTitle')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="int-datetime">{t('interview.scheduledAtLabel')}</Label>
            <Input
              id="int-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-location">{t('interview.locationLabel')}</Label>
            <Input
              id="int-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Rotterdam / Zoom / Phone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-notes">{t('interview.notesLabel')}</Label>
            <Textarea
              id="int-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
