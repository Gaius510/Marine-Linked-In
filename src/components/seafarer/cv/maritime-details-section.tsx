'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useUpdateSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { CvFormField } from './cv-form-field'
import type { SeafarerCvProfile } from './types'
import type { Availability } from '@/lib/types'
import { RANKS } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { Anchor, Loader2, Save } from 'lucide-react'

interface MaritimeForm {
  rank: string
  availability: Availability
  availableFrom: string
  yearsExperience: string
  cocGrade: string
  cocExpiry: string
}

function toForm(profile: SeafarerCvProfile): MaritimeForm {
  return {
    rank: profile.rank || '',
    availability: profile.availability || 'AVAILABLE',
    availableFrom: profile.availableFrom || '',
    yearsExperience: profile.yearsExperience || '',
    cocGrade: profile.cocGrade || '',
    cocExpiry: profile.cocExpiry || '',
  }
}

export function MaritimeDetailsSection({
  profile,
  complete,
}: {
  profile: SeafarerCvProfile
  complete: boolean
}) {
  const { t } = useI18n()
  const mutation = useUpdateSeafarerProfile()
  const [form, setForm] = useState<MaritimeForm>(() => toForm(profile))
  const [lastProfile, setLastProfile] = useState(profile)

  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm(toForm(profile))
  }

  const set = <K extends keyof MaritimeForm>(key: K, value: MaritimeForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const save = () => {
    if (mutation.isPending) return
    mutation.mutate(form, {
      onSuccess: () => toast.success(t('cv.maritimeSaved')),
      onError: () => toast.error(t('common.error')),
    })
  }

  const availabilityOptions: Availability[] = ['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE']

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <Anchor className="size-4 text-primary" />
          {t('cv.maritimeInfo')}
        </span>
      }
      subtitle={t('cv.maritimeInfoHint')}
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
          <CvFormField label={t('cv.rank')}>
            <Select value={form.rank} onValueChange={(value) => set('rank', value)}>
              <SelectTrigger className="w-full" aria-label={t('cv.rank')}>
                <SelectValue placeholder={t('cv.rank')} />
              </SelectTrigger>
              <SelectContent>
                {RANKS.map((rank) => (
                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CvFormField>
          <CvFormField id="cv-years-experience" label={t('cv.yearsExperience')}>
            <Input
              id="cv-years-experience"
              type="number"
              min={0}
              max={70}
              value={form.yearsExperience}
              onChange={(event) => set('yearsExperience', event.target.value)}
            />
          </CvFormField>
          <CvFormField id="cv-coc-grade" label={t('cv.cocGrade')}>
            <Input
              id="cv-coc-grade"
              value={form.cocGrade}
              onChange={(event) => set('cocGrade', event.target.value)}
              placeholder="e.g. II/2 Chief Mate"
            />
          </CvFormField>
          <CvFormField id="cv-coc-expiry" label={t('cv.cocExpiry')}>
            <Input id="cv-coc-expiry" type="date" value={form.cocExpiry} onChange={(event) => set('cocExpiry', event.target.value)} />
          </CvFormField>
        </div>

        <Separator />

        <CvFormField label={t('cv.availability')}>
          <RadioGroup
            value={form.availability}
            onValueChange={(value) => set('availability', value as Availability)}
            className="grid gap-3 sm:grid-cols-3"
          >
            {availabilityOptions.map((option) => (
              <label
                key={option}
                htmlFor={`cv-availability-${option}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
              >
                <RadioGroupItem id={`cv-availability-${option}`} value={option} />
                <span className="text-sm font-medium">{t(`availability.${option}`)}</span>
              </label>
            ))}
          </RadioGroup>
        </CvFormField>

        {form.availability === 'AVAILABLE' && (
          <CvFormField id="cv-available-from" label={t('cv.availableFrom')}>
            <Input
              id="cv-available-from"
              type="date"
              value={form.availableFrom}
              onChange={(event) => set('availableFrom', event.target.value)}
              className="sm:max-w-xs"
            />
          </CvFormField>
        )}

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
