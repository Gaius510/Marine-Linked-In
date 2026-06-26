'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { FieldError } from '@/components/shared/field-error'
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
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { useI18n } from '@/lib/i18n'
import { jobCreateSchema, type JobCreateInput } from '@/lib/validation/jobs'
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const fieldIds: Record<string, string> = {
    title: 'title',
    companyName: 'company',
    salaryMin: 'salary-min',
    salaryMax: 'salary-max',
    currency: 'currency',
    joiningDate: 'joining',
    location: 'location',
    description: 'desc',
    requirements: 'req',
  }

  const mutation = useMutation({
    mutationFn: (payload: JobCreateInput) => api.post('/api/jobs', payload),
    onSuccess: () => {
      toast.success(t('jobs.postSuccess'))
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setView('myJobs')
    },
    onError: (err: Error) => {
      const fields = apiFieldErrors(err)
      if (fields) {
        setFieldErrors(fields)
        focusFirstInvalid(fields, fieldIds)
        return
      }
      toast.error(t('common.error'))
    },
  })

  const buildPayload = () => ({
    title: form.title,
    rank: form.rank === 'ALL' ? '' : form.rank,
    vesselType: form.vesselType === 'ALL' ? '' : form.vesselType,
    companyName: form.companyName || undefined,
    salaryMin: form.salaryMin || undefined,
    salaryMax: form.salaryMax || undefined,
    currency: form.currency,
    contractDuration: form.contractDuration || undefined,
    joiningDate: form.joiningDate || undefined,
    location: form.location || undefined,
    description: form.description || undefined,
    requirements: form.requirements || undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    const result = validateFields(jobCreateSchema, buildPayload())
    if (result.errors) {
      setFieldErrors(result.errors)
      focusFirstInvalid(result.errors, fieldIds)
      return
    }
    mutation.mutate(result.data)
  }

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('jobs.postTitle')}
        subtitle={t('jobs.postSubtitle')}
        icon={<PlusCircle className="size-5" />}
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <SectionCard
          title={sectionTitle(<Briefcase className="size-4 text-primary" />, t('jobs.positionDetails'))}
          subtitle={t('jobs.positionDetailsHelp')}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.6fr)]">
            <Field label={t('jobs.jobTitle')} required error={fieldErrors.title} htmlFor="title">
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Chief Officer for LNG Carrier"
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              />
            </Field>
            <Field label={t('common.company')} helper={t('jobs.companyHelp')} error={fieldErrors.companyName} htmlFor="company">
              <Input
                id="company"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder={user?.company ?? 'Acme Shipping'}
                aria-invalid={!!fieldErrors.companyName}
                aria-describedby={fieldErrors.companyName ? 'company-error' : undefined}
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
            <Field label={t('jobs.salaryMin')} htmlFor="salary-min" error={fieldErrors.salaryMin}>
                <Input
                  id="salary-min"
                  value={form.salaryMin}
                  onChange={(e) => set('salaryMin', e.target.value)}
                  placeholder={t('jobs.salaryMin')}
                  type="number"
                  min={0}
                  aria-invalid={!!fieldErrors.salaryMin}
                  aria-describedby={fieldErrors.salaryMin ? 'salary-min-error' : undefined}
                />
              </Field>
              <Field label={t('jobs.salaryMax')} htmlFor="salary-max" error={fieldErrors.salaryMax}>
                <Input
                  id="salary-max"
                  value={form.salaryMax}
                  onChange={(e) => set('salaryMax', e.target.value)}
                  placeholder={t('jobs.salaryMax')}
                  type="number"
                  min={0}
                  aria-invalid={!!fieldErrors.salaryMax}
                  aria-describedby={fieldErrors.salaryMax ? 'salary-max-error' : undefined}
                />
              </Field>
              <SelectField
                id="currency"
                label={t('jobs.currency')}
                value={form.currency}
                onChange={(v) => set('currency', v)}
                options={CURRENCIES}
                includeAll={false}
                error={fieldErrors.currency}
              />
            </div>
            <Field label={t('common.location')} helper={t('jobs.locationHelper')} htmlFor="location" error={fieldErrors.location}>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder={t('jobs.locationPlaceholder')}
                aria-invalid={!!fieldErrors.location}
                aria-describedby={fieldErrors.location ? 'location-error' : undefined}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<CalendarClock className="size-4 text-primary" />, t('jobs.joiningInformationSection'))}
          subtitle={t('jobs.joiningInformationHelp')}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('jobs.joiningDate')} helper={t('jobs.joiningDateHelper')} htmlFor="joining" error={fieldErrors.joiningDate}>
              <Input
                id="joining"
                type="date"
                value={form.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
                aria-invalid={!!fieldErrors.joiningDate}
                aria-describedby={fieldErrors.joiningDate ? 'joining-error' : undefined}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={sectionTitle(<FileText className="size-4 text-primary" />, t('jobs.descriptionRequirementsSection'))}
          subtitle={t('jobs.descriptionRequirementsHelp')}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label={t('jobs.description')} htmlFor="desc" error={fieldErrors.description}>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={t('jobs.descriptionPlaceholder')}
                rows={5}
                aria-invalid={!!fieldErrors.description}
                aria-describedby={fieldErrors.description ? 'desc-error' : undefined}
              />
            </Field>
            <Field label={t('jobs.requirements')} htmlFor="req" error={fieldErrors.requirements}>
              <Textarea
                id="req"
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                placeholder={t('jobs.requirementsPlaceholder')}
                rows={5}
                aria-invalid={!!fieldErrors.requirements}
                aria-describedby={fieldErrors.requirements ? 'req-error' : undefined}
              />
            </Field>
          </div>
        </SectionCard>

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
  const { t } = useI18n()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label} {required && REQUIRED_MARK}
      </Label>
      {children}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      <FieldError id={`${htmlFor}-error`} code={error} t={t} />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  includeAll = true,
  error,
}: {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  includeAll?: boolean
  error?: string
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error} aria-describedby={error && id ? `${id}-error` : undefined}>
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
      {id && <FieldError id={`${id}-error`} code={error} t={t} />}
    </div>
  )
}
