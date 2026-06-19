'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { Job, ApplicationStatus } from '@/lib/types'
import { VESSEL_TYPES, RANKS } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { JobCard } from '@/components/shared/job-card'
import { ApplyDialog } from '@/components/seafarer/apply-dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Briefcase, Search, MapPin, Wallet, Clock, CalendarClock, Building2, Users, X, Send,
} from 'lucide-react'

interface JobsResponse { jobs: Job[]; total: number }

const statusTone: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  REVIEWED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  HIRED: 'bg-primary/10 text-primary border-primary/20',
}

export function SeafarerJobs() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [rank, setRank] = useState('all')
  const [vesselType, setVesselType] = useState('all')
  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (rank !== 'all') params.set('rank', rank)
  if (vesselType !== 'all') params.set('vesselType', vesselType)

  const queryKey = ['jobs', { search, rank, vesselType }]
  const { data, isLoading } = useQuery<JobsResponse>({
    queryKey,
    queryFn: () => api.get<JobsResponse>(`/api/jobs?${params.toString()}`),
  })

  const jobs = data?.jobs ?? []

  const openDetail = (job: Job) => {
    setDetailJob(job)
    setDetailOpen(true)
  }
  const openApply = (job: Job) => {
    setApplyJob(job)
    setApplyOpen(true)
  }

  const hasFilters = search.trim() !== '' || rank !== 'all' || vesselType !== 'all'
  const clearFilters = () => {
    setSearch('')
    setRank('all')
    setVesselType('all')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('jobs.title')}
        subtitle={t('jobs.subtitle')}
        icon={<Briefcase className="size-5" />}
      />

      {/* Filter bar */}
      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('jobs.searchPlaceholder')}
              className="ps-9"
            />
          </div>
          <Select value={rank} onValueChange={setRank}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allRanks')}</SelectItem>
              {RANKS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vesselType} onValueChange={setVesselType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allVessels')}</SelectItem>
              {VESSEL_TYPES.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {data?.total ?? 0} {t('common.results')}
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="size-3.5" />
              {t('common.clear')}
            </Button>
          </div>
        )}
      </Card>

      {/* Jobs grid */}
      {isLoading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-10 text-center">
          <Briefcase className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t('jobs.noOpenJobs')}</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
              {t('common.clear')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showRecruiter
              showApplicants
              onClick={() => openDetail(job)}
              actions={
                job.myApplicationStatus ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusTone[job.myApplicationStatus]}>
                      {t(`jobs.applicationStatus.${job.myApplicationStatus}`)}
                    </Badge>
                    <Button size="sm" variant="secondary" disabled>
                      {t('seafarer.applied')}
                    </Button>
                  </div>
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

      {/* Detail dialog */}
      <JobDetailDialog
        job={detailJob}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApply={(job) => {
          setDetailOpen(false)
          openApply(job)
        }}
      />

      {/* Apply dialog */}
      <ApplyDialog job={applyJob} open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  )
}

function JobDetailDialog({
  job, open, onOpenChange, onApply,
}: {
  job: Job | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onApply: (job: Job) => void
}) {
  const { t } = useI18n()
  if (!job) return null

  const salary = job.salaryMin || job.salaryMax
    ? `${job.salaryMin || '?'} – ${job.salaryMax || '?'} ${job.currency}`
    : null

  const alreadyApplied = !!job.myApplicationStatus

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <DialogDescription className="text-start">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" />
              {job.companyName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {job.rank && <Badge variant="outline">{job.rank}</Badge>}
          {job.vesselType && <Badge variant="outline">{job.vesselType}</Badge>}
          {job.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="size-3" />{job.location}
            </Badge>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {salary && (
            <DetailRow icon={<Wallet className="size-4" />} label={t('jobs.salaryRange').replace(' (per month)', '')} value={salary} />
          )}
          {job.contractDuration && (
            <DetailRow icon={<Clock className="size-4" />} label={t('jobs.contractDuration')} value={job.contractDuration} />
          )}
          {job.joiningDate && (
            <DetailRow icon={<CalendarClock className="size-4" />} label={t('jobs.joiningDate')} value={job.joiningDate} />
          )}
          <DetailRow
            icon={<Users className="size-4" />}
            label={t('jobs.applicants')}
            value={`${job._count?.applications ?? 0}`}
          />
        </div>

        {job.description && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t('jobs.description')}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
          </div>
        )}

        {job.requirements && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t('jobs.requirements')}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{job.requirements}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {alreadyApplied ? (
            <Button disabled>
              {t('jobs.alreadyApplied')}
            </Button>
          ) : (
            <Button onClick={() => onApply(job)}>
              <Send className="size-4" />
              {t('seafarer.applyNow')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  )
}
