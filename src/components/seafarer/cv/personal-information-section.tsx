'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUpdateSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { CvFormField, CvReadOnlyField } from './cv-form-field'
import type { SeafarerCvProfile } from './types'
import { NATIONALITIES } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { Save, UserRound, Loader2 } from 'lucide-react'

interface PersonalForm {
  phone: string
  city: string
  country: string
  nationality: string
  dateOfBirth: string
  bio: string
}

function toForm(profile: SeafarerCvProfile): PersonalForm {
  return {
    phone: profile.user.phone || '',
    city: profile.user.city || '',
    country: profile.user.country || '',
    nationality: profile.nationality || '',
    dateOfBirth: profile.dateOfBirth || '',
    bio: profile.bio || '',
  }
}

export function PersonalInformationSection({
  profile,
  complete,
}: {
  profile: SeafarerCvProfile
  complete: boolean
}) {
  const { t } = useI18n()
  const mutation = useUpdateSeafarerProfile()
  const [form, setForm] = useState<PersonalForm>(() => toForm(profile))
  const [lastProfile, setLastProfile] = useState(profile)

  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm(toForm(profile))
  }

  const set = <K extends keyof PersonalForm>(key: K, value: PersonalForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const save = () => {
    if (mutation.isPending) return
    mutation.mutate(form, {
      onSuccess: () => toast.success(t('cv.personalSaved')),
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <UserRound className="size-4 text-primary" />
          {t('cv.personalInfo')}
        </span>
      }
      subtitle={t('cv.personalInfoHint')}
      action={<StatusPill tone={complete ? 'success' : 'warning'}>{complete ? t('cv.complete') : t('cv.incomplete')}</StatusPill>}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CvReadOnlyField label={t('auth.name')} value={profile.user.name} />
          <CvReadOnlyField label={t('auth.email')} value={profile.user.email} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CvFormField id="cv-phone" label={t('auth.phone')}>
            <Input id="cv-phone" value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+1 234 567 8900" />
          </CvFormField>
          <CvFormField label={t('cv.nationality')}>
            <Select value={form.nationality} onValueChange={(value) => set('nationality', value)}>
              <SelectTrigger className="w-full" aria-label={t('cv.nationality')}>
                <SelectValue placeholder={t('cv.nationality')} />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nationality) => (
                  <SelectItem key={nationality} value={nationality}>{nationality}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CvFormField>
          <CvFormField id="cv-city" label={t('auth.city')}>
            <Input id="cv-city" value={form.city} onChange={(event) => set('city', event.target.value)} />
          </CvFormField>
          <CvFormField id="cv-country" label={t('auth.country')}>
            <Input id="cv-country" value={form.country} onChange={(event) => set('country', event.target.value)} />
          </CvFormField>
          <CvFormField id="cv-date-of-birth" label={t('cv.dateOfBirth')}>
            <Input id="cv-date-of-birth" type="date" value={form.dateOfBirth} onChange={(event) => set('dateOfBirth', event.target.value)} />
          </CvFormField>
        </div>

        <CvFormField id="cv-bio" label={t('cv.bio')} helper={t('cv.bioHelper')}>
          <Textarea
            id="cv-bio"
            rows={4}
            value={form.bio}
            onChange={(event) => set('bio', event.target.value)}
            placeholder={t('cv.bioPlaceholder')}
          />
        </CvFormField>

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
