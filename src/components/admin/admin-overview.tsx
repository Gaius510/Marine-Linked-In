'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Briefcase,
  Building2,
  Database,
  Send,
  ShieldCheck,
  Ship,
  UserCheck,
  Users,
} from 'lucide-react'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RankBreakdown } from './rank-breakdown'
import { SeafarerDetailDialog } from './seafarer-detail-dialog'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import { formatDate } from '@/lib/format'
import type { SeafarerWithOptionalRelations, SafeUser } from '@/lib/types'

interface AdminStats {
  totalSeafarers: number
  totalRecruiters: number
  totalJobs: number
  totalApplications: number
  availableNow: number
  onBoard: number
}

type AdminSeafarer = SeafarerWithOptionalRelations & { user: SafeUser & { createdAt: string } }

interface AdminStatsResponse {
  seafarers: AdminSeafarer[]
  allUsers: (SafeUser & { createdAt: string })[]
  stats: AdminStats
  total: number
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export function AdminOverview() {
  const { t } = useI18n()
  const setView = useNavStore((state) => state.setView)
  const [selected, setSelected] = useState<AdminSeafarer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'stats', { scope: 'overview' }],
    queryFn: () => api.get<AdminStatsResponse>('/api/admin/stats'),
    staleTime: 30_000,
  })

  const recentSeafarers = useMemo(() => {
    return (data?.seafarers ?? [])
      .slice()
      .sort((a, b) => new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime())
      .slice(0, 6)
  }, [data?.seafarers])

  const openDetail = (seafarer: AdminSeafarer) => {
    setSelected(seafarer)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">{t('admin.platformOperations')}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t('admin.welcome')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.masterSubtitle')}</p>
          </div>
        </div>
        <Button onClick={() => setView('masterList')} className="w-full sm:w-auto">
          <Database className="size-4" />
          {t('admin.viewFullDatabase')}
        </Button>
      </PageToolbar>

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label={t('admin.totalSeafarers')} value={data.stats.totalSeafarers} icon={Users} tone="primary" />
            <MetricCard label={t('admin.totalRecruiters')} value={data.stats.totalRecruiters} icon={Building2} tone="emerald" />
            <MetricCard label={t('admin.totalJobs')} value={data.stats.totalJobs} icon={Briefcase} tone="amber" />
            <MetricCard label={t('admin.totalApplications')} value={data.stats.totalApplications} icon={Send} tone="violet" />
            <MetricCard label={t('admin.availableNow')} value={data.stats.availableNow} icon={UserCheck} tone="emerald" />
            <MetricCard label={t('admin.onBoard')} value={data.stats.onBoard} icon={Ship} tone="amber" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <RankBreakdown seafarers={data.seafarers} />

            <SectionCard
              title={t('admin.recentSeafarers')}
              subtitle={t('admin.recentSeafarersDesc')}
              action={
                <Button variant="ghost" size="sm" onClick={() => setView('masterList')} className="text-primary hover:bg-secondary hover:text-primary">
                  {t('admin.viewFullDatabase')}
                  <ArrowRight className="size-4 rtl-flip" />
                </Button>
              }
            >
              {recentSeafarers.length === 0 ? (
                <EmptyState icon={Users} title={t('common.noResults')} framed={false} />
              ) : (
                <div className="grid gap-3">
                  {recentSeafarers.map((seafarer) => (
                    <div key={seafarer.id} className="space-y-2">
                      <SeafarerCard
                        seafarer={seafarer}
                        showSaved
                        onClick={() => openDetail(seafarer)}
                      />
                      <div className="flex justify-end">
                        <StatusPill tone="neutral" className="text-[10px]">
                          {t('admin.registeredOn')} {formatDate(seafarer.user.createdAt)}
                        </StatusPill>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}

      <SeafarerDetailDialog
        seafarer={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
