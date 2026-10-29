'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { CvFormField } from './cv-form-field'
import { getExpiryState } from './cv-status'
import { TravelAuthorizationsSection } from './travel-authorizations-section'
import type { SeafarerCvProfile } from './types'
import { formatDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { FileText, Loader2, Save } from 'lucide-react'

interface DocumentsForm {
  passportNo: string
  passportExpiry: string
}

function toForm(profile: SeafarerCvProfile): DocumentsForm {
  return {
    passportNo: profile.passportNo || '',
    passportExpiry: profile.passportExpiry || '',
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
      <div className="mb-4 border-s-2 border-primary bg-secondary/45 px-3 py-2 text-sm">
        <div>
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
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DocumentStatus
            label={t('cv.passportExpiry')}
            value={formatDate(form.passportExpiry, t('common.notProvided'))}
            status={passportState ? t(passportState.key) : undefined}
            tone={passportState?.tone}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t pt-5">
        <TravelAuthorizationsSection travelAuthorizations={profile.travelAuthorizations ?? []} />
      </div>
    </SectionCard>
  )
}

function DocumentStatus({
  label,
  value,
  status,
  tone,
}: {
  label: string
  value: string
  status?: string
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}) {
  return (
    <div className="border-t border-border pt-2">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
      {status && tone && <StatusPill tone={tone} className="mt-2">{status}</StatusPill>}
    </div>
  )
}
