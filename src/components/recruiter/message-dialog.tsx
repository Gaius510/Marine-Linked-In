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

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Single seafarer id (single-message mode) */
  seafarerId?: string
  /** Multiple seafarer ids (bulk mode) */
  seafarerIds?: string[]
  /** Recipient label for single mode (e.g. seafarer name) */
  recipientName?: string
  /** Called after a successful bulk send (parent may clear selection) */
  onBulkSuccess?: () => void
}

export function MessageDialog({
  open,
  onOpenChange,
  seafarerId,
  seafarerIds,
  recipientName,
  onBulkSuccess,
}: MessageDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const isBulk = !!seafarerIds && seafarerIds.length > 0
  const count = isBulk ? seafarerIds!.length : 1

  const mutation = useMutation({
    mutationFn: () => {
      const payload = isBulk
        ? { seafarerIds: seafarerIds!, subject, body }
        : { seafarerId: seafarerId!, subject, body }
      return api.post<{ count: number }>('/api/messages', payload)
    },
    onSuccess: (data) => {
      toast.success(t(isBulk ? 'browse.bulkMessageSuccess' : 'browse.messageSingleSuccess', { count: data.count }))
      qc.invalidateQueries({ queryKey: ['messages'] })
      onOpenChange(false)
      setSubject('')
      setBody('')
      if (isBulk) onBulkSuccess?.()
    },
    onError: (err: Error) => {
      toast.error(t('common.error'))
      console.error(err)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? t('browse.bulkMessageTitle') : t('browse.message')}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? t('browse.selected', { count })
              : recipientName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">{t('browse.bulkMessageSubject')}</Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('browse.subjectPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-body">{t('browse.bulkMessageBody')}</Label>
            <Textarea
              id="msg-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('browse.bodyPlaceholder')}
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !body.trim() || (isBulk && count === 0)}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('common.sending')}
                </>
              ) : (
                t('common.send')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
