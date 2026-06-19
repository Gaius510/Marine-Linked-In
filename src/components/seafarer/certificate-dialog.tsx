'use client'

import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { Certificate } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, Loader2 } from 'lucide-react'

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
      toast.success(t('cv.savedSuccess'))
      onOpenChange(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error(t('cv.certName'))
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            {isEdit ? t('cv.editCertificate') : t('cv.addCertificate')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label={t('cv.certName')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. STCW II/2 Chief Mate" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('cv.certNumber')}>
              <Input value={form.number} onChange={(e) => set('number', e.target.value)} />
            </Field>
            <Field label={t('cv.issuingAuthority')}>
              <Input value={form.issuingAuthority} onChange={(e) => set('issuingAuthority', e.target.value)} />
            </Field>
            <Field label={t('cv.issuedDate')}>
              <Input type="date" value={form.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} />
            </Field>
            <Field label={t('cv.expiryDate')}>
              <Input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label, required, children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
