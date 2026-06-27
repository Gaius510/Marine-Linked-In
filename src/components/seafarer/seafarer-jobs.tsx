'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { Job } from '@/lib/types'
import { VESSEL_TYPES, RANKS } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusPill } from '@/components/shared/status-pill'
import { JobCard } from '@/components/shared/job-card'
import { ApplyDialog } from '@/components/seafarer/apply-dialog'
import { JobDetailDialog } from '@/components/seafarer/job-detail-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Briefcase, Search, X, Send, SlidersHorizontal } from 'lucide-react'

interface JobsResponse { jobs: Job[]; total: number }

export function SeafarerJobs() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [rank, setRank] = useState('all')
  const [vesselType, setVesselType] = useState('all')
  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  const params = useMemo(() => {
    const next = new URLSearchParams()
    if (search.trim()) next.set('search', search.trim())
    if (rank !== 'all') next.set('rank', rank)
    if (vesselType !== 'all') next.set('vesselType', vesselType)
    return next
  }, [search, rank, vesselType])

  const queryKey = ['jobs', { search, rank, vesselType }]
  const { data, isLoading, isError, refetch } = useQuery<JobsResponse>({
    queryKey,
    queryFn: () => api.get<JobsResponse>(`/api/jobs?${params.toString()}`),
  })

  const jobs = data?.jobs ?? []
  const resultCount = data?.total ?? jobs.length
  const hasFilters = search.trim() !== '' || rank !== 'all' || vesselType !== 'all'
  const activeFilters = [
    ...(search.trim() ? [{ key: 'search', label: t('common.search'), value: search.trim() }] : []),
    ...(rank !== 'all' ? [{ key: 'rank', label: t('browse.filterRank'), value: rank }] : []),
    ...(vesselType !== 'all' ? [{ key: 'vesselType', label: t('browse.filterVessel'), value: vesselType }] : []),
  ]

  const openDetail = (job: Job) => {
    setDetailJob(job)
    setDetailOpen(true)
  }
  const openApply = (job: Job) => {
    setApplyJob(job)
    setApplyOpen(true)
  }

  const clearFilters = () => {
    setSearch('')
    setRank('all')
    setVesselType('all')
  }

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'rank') setRank('all')
    if (key === 'vesselType') setVesselType('all')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('jobs.title')}
        subtitle={t('jobs.subtitle')}
        icon={<Briefcase className="size-5" />}
      />

      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            {t('jobs.jobFilters')}
          </span>
        }
        subtitle={hasFilters ? t('browse.activeFilters', { count: activeFilters.length }) : t('jobs.filterHelp')}
        action={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              <X className="size-3.5" />
              {t('browse.clearAllFilters')}
            </Button>
          ) : undefined
        }
        className="p-4 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div>
            <Label htmlFor="job-search" className="sr-only">{t('common.search')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="job-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('jobs.searchPlaceholder')}
                className="ps-9"
              />
            </div>
          </div>
          <Select value={rank} onValueChange={setRank}>
            <SelectTrigger className="w-full" aria-label={t('jobs.allRanks')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allRanks')}</SelectItem>
              {RANKS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vesselType} onValueChange={setVesselType}>
            <SelectTrigger className="w-full" aria-label={t('jobs.allVessels')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allVessels')}</SelectItem>
              {VESSEL_TYPES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <StatusPill key={filter.key} tone="primary" className="gap-1.5 rounded-md px-2 py-1 font-normal">
                <span className="text-muted-foreground">{filter.label}:</span>
                <span className="min-w-0 max-w-[12rem] truncate">{filter.value}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(filter.key)}
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${t('common.clear')} ${filter.label}`}
                >
                  <X className="size-3" />
                </button>
              </StatusPill>
            ))}
          </div>
        )}
      </SectionCard>

      <PageToolbar className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">
        <div className="text-sm">
          <span className="font-medium text-foreground">
            {isLoading ? t('common.loading') : `${resultCount} ${t('common.results')}`}
          </span>
          {hasFilters && !isLoading ? (
            <span className="text-muted-foreground"> · {t('browse.activeFilters', { count: activeFilters.length })}</span>
          ) : null}
        </div>
      </PageToolbar>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t('jobs.noOpenJobs')}
          description={hasFilters ? t('jobs.noResultsHelp') : t('jobs.noOpenJobsHelp')}
          action={hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="size-4" />
              {t('common.clear')}
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showRecruiter
              showApplicants
              applicationStatus={job.myApplicationStatus}
              onClick={() => openDetail(job)}
              actions={
                job.myApplicationStatus ? (
                  <Button size="sm" variant="secondary" disabled>
                    {t('seafarer.applied')}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => openApply(job)}>
                    <Send className="size-3.5" />
                    {t('seafarer.applyNow')}
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      <JobDetailDialog
        job={detailJob}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApply={(job) => {
          setDetailOpen(false)
          openApply(job)
        }}
      />

      <ApplyDialog job={applyJob} open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  )
}
