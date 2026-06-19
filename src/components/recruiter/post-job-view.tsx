'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
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
import { Loader2, PlusCircle } from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'INR', 'PHP']

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
    if (!form.title.trim()) {
      setError('missing_title')
      return
    }
    mutation.mutate()
  }

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div>
      <PageHeader title={t('jobs.postTitle')} icon={<PlusCircle className="size-5" />} />

      <Card className="p-5 sm:p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              {t('jobs.jobTitle')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Chief Officer for LNG Carrier"
              required
            />
          </div>

          {/* Rank & vessel */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rank">{t('cv.rank')}</Label>
              <Select value={form.rank} onValueChange={(v) => set('rank', v)}>
                <SelectTrigger id="rank" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('common.all')}</SelectItem>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vessel">{t('cv.vesselType')}</Label>
              <Select value={form.vesselType} onValueChange={(v) => set('vesselType', v)}>
                <SelectTrigger id="vessel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('common.all')}</SelectItem>
                  {VESSEL_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">{t('common.company')}</Label>
            <Input
              id="company"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder={user?.company ?? 'Acme Shipping'}
            />
          </div>

          {/* Salary range */}
          <div className="space-y-1.5">
            <Label>{t('jobs.salaryRange')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                value={form.salaryMin}
                onChange={(e) => set('salaryMin', e.target.value)}
                placeholder={t('jobs.salaryMin')}
                type="number"
                min={0}
              />
              <Input
                value={form.salaryMax}
                onChange={(e) => set('salaryMax', e.target.value)}
                placeholder={t('jobs.salaryMax')}
                type="number"
                min={0}
              />
              <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contract duration + joining date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contract">{t('jobs.contractDuration')}</Label>
              <Input
                id="contract"
                value={form.contractDuration}
                onChange={(e) => set('contractDuration', e.target.value)}
                placeholder={t('jobs.contractDurationPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joining">{t('jobs.joiningDate')}</Label>
              <Input
                id="joining"
                type="date"
                value={form.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">{t('common.location')}</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder={t('jobs.locationPlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">{t('jobs.description')}</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('jobs.descriptionPlaceholder')}
              rows={4}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <Label htmlFor="req">{t('jobs.requirements')}</Label>
            <Textarea
              id="req"
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              placeholder={t('jobs.requirementsPlaceholder')}
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
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
        </form>
      </Card>
    </div>
  )
}
