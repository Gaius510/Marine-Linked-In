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
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { useI18n } from '@/lib/i18n'
import { seafarerProfileUpdateSchema } from '@/lib/validation/seafarers'
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [lastProfile, setLastProfile] = useState(profile)

  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm(toForm(profile))
    setFieldErrors({})
  }

  const fieldIds: Record<string, string> = {
    phone: 'cv-phone',
    city: 'cv-city',
    country: 'cv-country',
    nationality: 'cv-nationality',
    dateOfBirth: 'cv-date-of-birth',
    bio: 'cv-bio',
  }

  const set = <K extends keyof PersonalForm>(key: K, value: PersonalForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  const save = () => {
    if (mutation.isPending) return
    setFieldErrors({})
    const result = validateFields(seafarerProfileUpdateSchema, form)
    if (result.errors) {
      setFieldErrors(result.errors)
      focusFirstInvalid(result.errors, fieldIds)
      return
    }
    mutation.mutate(result.data, {
      onSuccess: () => toast.success(t('cv.personalSaved')),
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
        noValidate
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
          <CvFormField id="cv-phone" label={t('auth.phone')} error={fieldErrors.phone}>
            <Input id="cv-phone" value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+1 234 567 8900" aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? 'cv-phone-error' : undefined} />
          </CvFormField>
          <CvFormField id="cv-nationality" label={t('cv.nationality')} error={fieldErrors.nationality}>
            <Select value={form.nationality} onValueChange={(value) => set('nationality', value)}>
              <SelectTrigger id="cv-nationality" className="w-full" aria-label={t('cv.nationality')} aria-invalid={!!fieldErrors.nationality} aria-describedby={fieldErrors.nationality ? 'cv-nationality-error' : undefined}>
                <SelectValue placeholder={t('cv.nationality')} />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nationality) => (
                  <SelectItem key={nationality} value={nationality}>{nationality}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CvFormField>
          <CvFormField id="cv-city" label={t('auth.city')} error={fieldErrors.city}>
            <Input id="cv-city" value={form.city} onChange={(event) => set('city', event.target.value)} aria-invalid={!!fieldErrors.city} aria-describedby={fieldErrors.city ? 'cv-city-error' : undefined} />
          </CvFormField>
          <CvFormField id="cv-country" label={t('auth.country')} error={fieldErrors.country}>
            <Input id="cv-country" value={form.country} onChange={(event) => set('country', event.target.value)} aria-invalid={!!fieldErrors.country} aria-describedby={fieldErrors.country ? 'cv-country-error' : undefined} />
          </CvFormField>
          <CvFormField id="cv-date-of-birth" label={t('cv.dateOfBirth')} error={fieldErrors.dateOfBirth}>
            <Input id="cv-date-of-birth" type="date" value={form.dateOfBirth} onChange={(event) => set('dateOfBirth', event.target.value)} aria-invalid={!!fieldErrors.dateOfBirth} aria-describedby={fieldErrors.dateOfBirth ? 'cv-date-of-birth-error' : undefined} />
          </CvFormField>
        </div>

        <CvFormField id="cv-bio" label={t('cv.bio')} helper={t('cv.bioHelper')} error={fieldErrors.bio}>
          <Textarea
            id="cv-bio"
            rows={4}
            value={form.bio}
            onChange={(event) => set('bio', event.target.value)}
            placeholder={t('cv.bioPlaceholder')}
            aria-invalid={!!fieldErrors.bio}
            aria-describedby={fieldErrors.bio ? 'cv-bio-error' : undefined}
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
