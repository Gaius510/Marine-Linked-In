'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Building2, Briefcase, Send, UserCheck, Ship, ArrowRight, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { ErrorState } from '@/components/shared/error-state'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RankBreakdown } from './rank-breakdown'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { SeafarerWithRelations, SafeUser } from '@/lib/types'

interface AdminStats {
  totalSeafarers: number
  totalRecruiters: number
  totalJobs: number
  totalApplications: number
  availableNow: number
  onBoard: number
}

interface AdminStatsResponse {
  seafarers: (SeafarerWithRelations & { user: SafeUser & { createdAt: string } })[]
  allUsers: (SafeUser & { createdAt: string })[]
  stats: AdminStats
  total: number
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function AdminOverview() {
  const { t } = useI18n()
  const setView = useNavStore((s) => s.setView)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'stats', { scope: 'overview' }],
    queryFn: () => api.get<AdminStatsResponse>('/api/admin/stats'),
    staleTime: 30_000,
  })

  return (
    <div>
      <PageHeader
        title={t('admin.welcome')}
        subtitle={t('admin.masterSubtitle')}
        icon={<ShieldCheck className="size-5" />}
      />

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label={t('admin.totalSeafarers')}
              value={data.stats.totalSeafarers}
              icon={Users}
              tone="primary"
            />
            <StatCard
              label={t('admin.totalRecruiters')}
              value={data.stats.totalRecruiters}
              icon={Building2}
              tone="emerald"
            />
            <StatCard
              label={t('admin.totalJobs')}
              value={data.stats.totalJobs}
              icon={Briefcase}
              tone="amber"
            />
            <StatCard
              label={t('admin.totalApplications')}
              value={data.stats.totalApplications}
              icon={Send}
              tone="violet"
            />
            <StatCard
              label={t('admin.availableNow')}
              value={data.stats.availableNow}
              icon={UserCheck}
              tone="emerald"
            />
            <StatCard
              label={t('admin.onBoard')}
              value={data.stats.onBoard}
              icon={Ship}
              tone="amber"
            />
          </div>

          {/* Rank breakdown */}
          <RankBreakdown seafarers={data.seafarers} />

          {/* Recently registered seafarers */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold">{t('admin.recentSeafarers')}</h3>
              <Button variant="outline" size="sm" onClick={() => setView('masterList')}>
                {t('admin.viewFullDatabase')}
                <ArrowRight className="size-4 rtl-flip" />
              </Button>
            </div>
            {data.seafarers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.seafarers
                  .slice()
                  .sort((a, b) => new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime())
                  .slice(0, 5)
                  .map((s) => (
                    <SeafarerCard
                      key={s.id}
                      seafarer={s}
                      showSaved
                    />
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
