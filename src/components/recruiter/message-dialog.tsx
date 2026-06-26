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
import { messageCreateSchema, type MessageCreateInput } from '@/lib/validation/messages'
import { toast } from 'sonner'
import { Loader2, Mail, Users } from 'lucide-react'

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const isBulk = !!seafarerIds && seafarerIds.length > 0
  const count = isBulk ? seafarerIds!.length : 1

  const mutation = useMutation({
    mutationFn: (payload: MessageCreateInput) => api.post<{ count: number }>('/api/messages', payload),
    onSuccess: (data) => {
      toast.success(t(isBulk ? 'browse.bulkMessageSuccess' : 'browse.messageSingleSuccess', { count: data.count }))
      qc.invalidateQueries({ queryKey: ['messages'] })
      onOpenChange(false)
      setSubject('')
      setBody('')
      setFieldErrors({})
      if (isBulk) onBulkSuccess?.()
    },
    onError: (err: Error) => {
      const fields = apiFieldErrors(err)
      if (fields) {
        setFieldErrors(fields)
        focusFirstInvalid(fields, { subject: 'msg-subject', body: 'msg-body', seafarerId: 'msg-body' })
        return
      }
      toast.error(t('common.error'))
      console.error(err)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    const payload = isBulk
      ? { seafarerIds: seafarerIds!, subject, body }
      : { seafarerId: seafarerId!, subject, body }
    const result = validateFields(messageCreateSchema, payload)
    if (result.errors) {
      setFieldErrors(result.errors)
      focusFirstInvalid(result.errors, { subject: 'msg-subject', body: 'msg-body', seafarerId: 'msg-body' })
      return
    }
    mutation.mutate(result.data)
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
          <DialogTitle>
            {isBulk ? t('browse.bulkMessageTitle') : t('browse.message')}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? t('browse.bulkMessageDescription', { count })
              : t('browse.singleMessageDescription', { name: recipientName ?? t('interview.candidate') })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border/80 bg-secondary/45 p-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                {isBulk ? <Users className="size-4" /> : <Mail className="size-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {isBulk ? t('browse.bulkRecipients') : t('browse.messageRecipient')}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {isBulk ? t('browse.selectedCandidates', { count }) : recipientName}
                </div>
                <FieldError id="msg-recipient-error" code={fieldErrors.seafarerId} t={t} />
              </div>
              {isBulk && <StatusPill tone="primary">{count}</StatusPill>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">{t('browse.bulkMessageSubject')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setFieldErrors((current) => ({ ...current, subject: '' }))
              }}
              placeholder={t('browse.subjectPlaceholder')}
              aria-invalid={!!fieldErrors.subject}
              aria-describedby={fieldErrors.subject ? 'msg-subject-error' : undefined}
            />
            <FieldError id="msg-subject-error" code={fieldErrors.subject} t={t} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-body">{t('browse.bulkMessageBody')}</Label>
            <Textarea
              id="msg-body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                setFieldErrors((current) => ({ ...current, body: '' }))
              }}
              placeholder={t('browse.bodyPlaceholder')}
              rows={5}
              aria-invalid={!!fieldErrors.body}
              aria-describedby={fieldErrors.body ? 'msg-body-error' : undefined}
            />
            <FieldError id="msg-body-error" code={fieldErrors.body} t={t} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
