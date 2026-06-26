'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth-store'
import { useNavStore } from '@/stores/nav-store'
import { toast } from 'sonner'
import { VESSEL_TYPES, RANKS } from '@/lib/types'
import { Briefcase, CalendarClock, FileText, Loader2, PlusCircle, Ship, Wallet } from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'INR', 'PHP']

const REQUIRED_MARK = <span className="text-destructive">*</span>

export function PostJobView() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const setView = useNavStore((s) => s.setView)

  const [form, setForm] = useState({
    title: '',
    rank: 'ALL',
    vesselType: 'ALL',
    companyName: user?.company ?? '',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    contractDuration: '',
    joiningDate: '',
    location: '',
    description: '',
    requirements: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const titleError = submitted && !form.title.trim()

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/jobs', {
        title: form.title.trim(),
        rank: form.rank === 'ALL' ? '' : form.rank,
        vesselType: form.vesselType === 'ALL' ? '' : form.vesselType,
        companyName: form.companyName.trim() || undefined,
        salaryMin: form.salaryMin || undefined,
        salaryMax: form.salaryMax || undefined,
        currency: form.currency,
        contractDuration: form.contractDuration || undefined,
        joiningDate: form.joiningDate || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        requirements: form.requirements || undefined,
      }),
    onSuccess: () => {
      toast.success(t('jobs.postSuccess'))
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setView('myJobs')
    },
    onError: (err: Error) => {
      setError(err.message)
      toast.error(t('common.error'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitted(true)
    if (!form.title.trim()) {
      setError('missing_title')
      return
    }
    mutation.mutate()
  }

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('jobs.postTitle')}
        subtitle={t('jobs.postSubtitle')}
        icon={<PlusCircle className="size-5" />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard
          title={sectionTitle(<Briefcase className="size-4 text-primary" />, t('jobs.positionDetails'))}
          subtitle={t('jobs.positionDetailsHelp')}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.6fr)]">
            <Field label={t('jobs.jobTitle')} required error={titleError ? t('jobs.titleRequired') : undefined} htmlFor="title">
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Chief Officer for LNG Carrier"
                required
                aria-invalid={titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
              />
            </Field>
            <Field label={t('common.company')} helper={t('jobs.companyHelp')} htmlFor="company">
              <Input
                id="company"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder={user?.company ?? 'Acme Shipping'}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<Ship className="size-4 text-primary" />, t('jobs.vesselContractSection'))}
          subtitle={t('jobs.vesselContractHelp')}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label={t('cv.rank')}
              value={form.rank}
              onChange={(v) => set('rank', v)}
              options={RANKS}
            />
            <SelectField
              label={t('cv.vesselType')}
              value={form.vesselType}
              onChange={(v) => set('vesselType', v)}
              options={VESSEL_TYPES}
            />
            <Field label={t('jobs.contractDuration')} helper={t('jobs.contractDurationHelper')} htmlFor="contract">
              <Input
                id="contract"
                value={form.contractDuration}
                onChange={(e) => set('contractDuration', e.target.value)}
                placeholder={t('jobs.contractDurationPlaceholder')}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<Wallet className="size-4 text-primary" />, t('jobs.compensationLocationSection'))}
          subtitle={t('jobs.compensationLocationHelp')}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
              <Field label={t('jobs.salaryMin')} htmlFor="salary-min">
                <Input
                  id="salary-min"
                  value={form.salaryMin}
                  onChange={(e) => set('salaryMin', e.target.value)}
                  placeholder={t('jobs.salaryMin')}
                  type="number"
                  min={0}
                />
              </Field>
              <Field label={t('jobs.salaryMax')} htmlFor="salary-max">
                <Input
                  id="salary-max"
                  value={form.salaryMax}
                  onChange={(e) => set('salaryMax', e.target.value)}
                  placeholder={t('jobs.salaryMax')}
                  type="number"
                  min={0}
                />
              </Field>
              <SelectField
                label={t('jobs.currency')}
                value={form.currency}
                onChange={(v) => set('currency', v)}
                options={CURRENCIES}
                includeAll={false}
              />
            </div>
            <Field label={t('common.location')} helper={t('jobs.locationHelper')} htmlFor="location">
              <Input
                id="location"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder={t('jobs.locationPlaceholder')}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<CalendarClock className="size-4 text-primary" />, t('jobs.joiningInformationSection'))}
          subtitle={t('jobs.joiningInformationHelp')}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('jobs.joiningDate')} helper={t('jobs.joiningDateHelper')} htmlFor="joining">
              <Input
                id="joining"
                type="date"
                value={form.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<FileText className="size-4 text-primary" />, t('jobs.descriptionRequirementsSection'))}
          subtitle={t('jobs.descriptionRequirementsHelp')}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label={t('jobs.description')} htmlFor="desc">
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={t('jobs.descriptionPlaceholder')}
                rows={5}
              />
            </Field>
            <Field label={t('jobs.requirements')} htmlFor="req">
              <Textarea
                id="req"
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                placeholder={t('jobs.requirementsPlaceholder')}
                rows={5}
              />
            </Field>
          </div>
        </SectionCard>

        {error && (
          <p className="text-sm text-destructive">
            {error === 'missing_title' ? t('jobs.titleRequired') : error}
          </p>
        )}

        <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">{t('jobs.postingHelp')}</p>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setView('myJobs')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="min-w-32">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('jobs.posting')}
                </>
              ) : (
                t('jobs.postCta')
              )}
            </Button>
          </div>
        </PageToolbar>
      </form>
    </div>
  )
}

function sectionTitle(icon: ReactNode, title: string) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {title}
    </span>
  )
}

function Field({
  label,
  helper,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string
  helper?: string
  error?: string
  required?: boolean
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label} {required && REQUIRED_MARK}
      </Label>
      {children}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && <p id={`${htmlFor}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  includeAll = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  includeAll?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="ALL">{t('common.all')}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
