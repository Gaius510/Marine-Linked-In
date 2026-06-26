'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { CvFormField } from './cv-form-field'
import { getExpiryState } from './cv-status'
import type { SeafarerCvProfile } from './types'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { CalendarClock, FileText, Globe2, Loader2, Save, ShieldCheck } from 'lucide-react'

interface DocumentsForm {
  passportNo: string
  passportExpiry: string
  usVisa: string
  schengenVisa: string
}

function toForm(profile: SeafarerCvProfile): DocumentsForm {
  return {
    passportNo: profile.passportNo || '',
    passportExpiry: profile.passportExpiry || '',
    usVisa: profile.usVisa || '',
    schengenVisa: profile.schengenVisa || '',
  }
}

export function DocumentsSection({
  profile,
  complete,
}: {
  profile: SeafarerCvProfile
  complete: boolean
}) {
  const { t } = useI18n()
  const mutation = useUpdateSeafarerProfile()
  const [form, setForm] = useState<DocumentsForm>(() => toForm(profile))
  const [lastProfile, setLastProfile] = useState(profile)
  const passportState = getExpiryState(form.passportExpiry)

  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm(toForm(profile))
  }

  const set = <K extends keyof DocumentsForm>(key: K, value: DocumentsForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const save = () => {
    if (mutation.isPending) return
    mutation.mutate(form, {
      onSuccess: () => toast.success(t('cv.documentsSaved')),
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          {t('cv.documents')}
        </span>
      }
      subtitle={t('cv.documentsHint')}
      action={<StatusPill tone={complete ? 'success' : 'warning'}>{complete ? t('cv.complete') : t('cv.incomplete')}</StatusPill>}
    >
      <div className="mb-4 rounded-lg border border-primary/20 bg-secondary p-3 text-sm">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">{t('cv.documentPrivacyHint')}</p>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CvFormField id="cv-passport-no" label={t('cv.passportNo')}>
            <Input id="cv-passport-no" value={form.passportNo} onChange={(event) => set('passportNo', event.target.value)} />
          </CvFormField>
          <CvFormField id="cv-passport-expiry" label={t('cv.passportExpiry')}>
            <Input id="cv-passport-expiry" type="date" value={form.passportExpiry} onChange={(event) => set('passportExpiry', event.target.value)} />
          </CvFormField>
          <CvFormField id="cv-us-visa" label={t('cv.usVisa')}>
            <Input
              id="cv-us-visa"
              value={form.usVisa}
              onChange={(event) => set('usVisa', event.target.value)}
              placeholder="e.g. Valid C1/D until 2027"
            />
          </CvFormField>
          <CvFormField id="cv-schengen-visa" label={t('cv.schengenVisa')}>
            <Input
              id="cv-schengen-visa"
              value={form.schengenVisa}
              onChange={(event) => set('schengenVisa', event.target.value)}
              placeholder="e.g. Valid until 2026"
            />
          </CvFormField>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <DocumentStatus
            icon={<CalendarClock className="size-4" />}
            label={t('cv.passportExpiry')}
            value={formatDate(form.passportExpiry, t('common.notProvided'))}
            status={passportState ? t(passportState.key) : undefined}
            tone={passportState?.tone}
          />
          <DocumentStatus
            icon={<Globe2 className="size-4" />}
            label={t('cv.usVisa')}
            value={safeText(form.usVisa, t('common.notProvided'))}
          />
          <DocumentStatus
            icon={<Globe2 className="size-4" />}
            label={t('cv.schengenVisa')}
            value={safeText(form.schengenVisa, t('common.notProvided'))}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

function DocumentStatus({
  icon,
  label,
  value,
  status,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  status?: string
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="break-words text-sm font-medium">{value}</div>
      {status && tone && <StatusPill tone={tone} className="mt-2">{status}</StatusPill>}
    </div>
  )
}
