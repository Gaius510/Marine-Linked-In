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
import { FieldError } from '@/components/shared/field-error'
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { certificateSchema, type CertificateInput } from '@/lib/validation/seafarers'
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  // Reset the form whenever the dialog opens or the target certificate changes.
  const sessionKey = `${open ? 'open' : 'closed'}_${certificate?.id ?? 'new'}`
  const [lastSession, setLastSession] = useState(sessionKey)
  if (sessionKey !== lastSession) {
    setLastSession(sessionKey)
    if (open) {
      setForm(certificate ? toForm(certificate) : empty)
      setFieldErrors({})
    }
  }

  const fieldIds: Record<string, string> = {
    name: 'certificate-name',
    number: 'certificate-number',
    issuingAuthority: 'certificate-authority',
    issuedDate: 'certificate-issued-date',
    expiryDate: 'certificate-expiry-date',
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((current) => ({ ...current, [k]: '' }))
  }

  const mutation = useMutation({
    mutationFn: async (payload: CertificateInput) => {
      if (isEdit && certificate) {
        return api.put<{ certificate: Certificate }>(
          `/api/seafarers/me/certificates/${certificate.id}?id=${certificate.id}`,
          payload
        )
      }
      return api.post<{ certificate: Certificate }>('/api/seafarers/me/certificates', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t(isEdit ? 'cv.certificateUpdated' : 'cv.certificateAdded'))
      onOpenChange(false)
    },
    onError: (err) => {
      const fields = apiFieldErrors(err)
      if (fields) {
        setFieldErrors(fields)
        focusFirstInvalid(fields, fieldIds)
        return
      }
      toast.error(t('common.error'))
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (mutation.isPending) return
    setFieldErrors({})
    const result = validateFields(certificateSchema, form)
    if (result.errors) {
      setFieldErrors(result.errors)
      focusFirstInvalid(result.errors, fieldIds)
      return
    }
    mutation.mutate(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            {isEdit ? t('cv.editCertificate') : t('cv.addCertificate')}
          </DialogTitle>
          <DialogDescription>{t('cv.certificatesHint')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
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
              <Field id="certificate-name" label={t('cv.certName')} required error={fieldErrors.name}>
                <Input
                  id="certificate-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. STCW II/2 Chief Mate"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'certificate-name-error' : undefined}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="certificate-number" label={t('cv.certNumber')} error={fieldErrors.number}>
                  <Input id="certificate-number" value={form.number} onChange={(e) => set('number', e.target.value)} aria-invalid={!!fieldErrors.number} aria-describedby={fieldErrors.number ? 'certificate-number-error' : undefined} />
                </Field>
                <Field id="certificate-authority" label={t('cv.issuingAuthority')} error={fieldErrors.issuingAuthority}>
                  <Input id="certificate-authority" value={form.issuingAuthority} onChange={(e) => set('issuingAuthority', e.target.value)} aria-invalid={!!fieldErrors.issuingAuthority} aria-describedby={fieldErrors.issuingAuthority ? 'certificate-authority-error' : undefined} />
                </Field>
                <Field id="certificate-issued-date" label={t('cv.issuedDate')} error={fieldErrors.issuedDate}>
                  <Input id="certificate-issued-date" type="date" value={form.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} aria-invalid={!!fieldErrors.issuedDate} aria-describedby={fieldErrors.issuedDate ? 'certificate-issued-date-error' : undefined} />
                </Field>
                <Field id="certificate-expiry-date" label={t('cv.expiryDate')} error={fieldErrors.expiryDate}>
                  <Input id="certificate-expiry-date" type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} aria-invalid={!!fieldErrors.expiryDate} aria-describedby={fieldErrors.expiryDate ? 'certificate-expiry-date-error' : undefined} />
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
  id, label, required, error, children,
}: {
  id?: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
      {id && <FieldError id={`${id}-error`} code={error} t={t} />}
    </div>
  )
}
