'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Certificate } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/shared/section-card'
import { Award, CalendarClock, Loader2 } from 'lucide-react'

interface CertificateDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  certificate?: Certificate | null
}

interface FormState {
  name: string
  number: string
  issuedDate: string
  expiryDate: string
  issuingAuthority: string
}

const empty: FormState = { name: '', number: '', issuedDate: '', expiryDate: '', issuingAuthority: '' }

function toForm(c: Certificate): FormState {
  return {
    name: c.name || '',
    number: c.number || '',
    issuedDate: c.issuedDate || '',
    expiryDate: c.expiryDate || '',
    issuingAuthority: c.issuingAuthority || '',
  }
}

export function CertificateDialog({ open, onOpenChange, certificate }: CertificateDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const isEdit = !!certificate
  const [form, setForm] = useState<FormState>(() => certificate ? toForm(certificate) : empty)
  // Reset the form whenever the dialog opens or the target certificate changes.
  const sessionKey = `${open ? 'open' : 'closed'}_${certificate?.id ?? 'new'}`
  const [lastSession, setLastSession] = useState(sessionKey)
  if (sessionKey !== lastSession) {
    setLastSession(sessionKey)
    if (open) {
      setForm(certificate ? toForm(certificate) : empty)
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && certificate) {
        return api.put<{ certificate: Certificate }>(
          `/api/seafarers/me/certificates/${certificate.id}?id=${certificate.id}`,
          form
        )
      }
      return api.post<{ certificate: Certificate }>('/api/seafarers/me/certificates', form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t(isEdit ? 'cv.certificateUpdated' : 'cv.certificateAdded'))
      onOpenChange(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (mutation.isPending) return
    if (!form.name.trim()) {
      toast.error(t('cv.certName'))
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            {isEdit ? t('cv.editCertificate') : t('cv.addCertificate')}
          </DialogTitle>
          <DialogDescription>{t('cv.certificatesHint')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                <Award className="size-4 text-primary" />
                {t('cv.certificatesTraining')}
              </span>
            }
            subtitle={t('cv.certificatesHint')}
            className="p-4"
          >
            <div className="space-y-4">
              <Field id="certificate-name" label={t('cv.certName')} required>
                <Input
                  id="certificate-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. STCW II/2 Chief Mate"
                  aria-required="true"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="certificate-number" label={t('cv.certNumber')}>
                  <Input id="certificate-number" value={form.number} onChange={(e) => set('number', e.target.value)} />
                </Field>
                <Field id="certificate-authority" label={t('cv.issuingAuthority')}>
                  <Input id="certificate-authority" value={form.issuingAuthority} onChange={(e) => set('issuingAuthority', e.target.value)} />
                </Field>
                <Field id="certificate-issued-date" label={t('cv.issuedDate')}>
                  <Input id="certificate-issued-date" type="date" value={form.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} />
                </Field>
                <Field id="certificate-expiry-date" label={t('cv.expiryDate')}>
                  <Input id="certificate-expiry-date" type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
                </Field>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-secondary p-3 text-xs text-muted-foreground">
                <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{t('cv.certificateExpiryHint')}</span>
              </div>
            </div>
          </SectionCard>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending ? t('common.saving') : isEdit ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id, label, required, children,
}: {
  id?: string
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
