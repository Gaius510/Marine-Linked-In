'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Filter,
  X,
  Database,
  Table as TableIcon,
  LayoutGrid,
  Download,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { ErrorState } from '@/components/shared/error-state'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { SeafarerDetailDialog } from './seafarer-detail-dialog'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { SeafarerWithRelations, SafeUser, Availability } from '@/lib/types'
import { VESSEL_TYPES, RANKS, NATIONALITIES } from '@/lib/types'

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

const AVAILABILITY_VALUES: Availability[] = ['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE']
const ALL = 'all'

interface Filters {
  search: string
  rank: string
  vesselType: string
  nationality: string
  availability: string
  minYears: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  rank: ALL,
  vesselType: ALL,
  nationality: ALL,
  availability: ALL,
  minYears: '',
}

function buildQueryString(f: Filters): string {
  const params = new URLSearchParams()
  if (f.search.trim()) params.set('search', f.search.trim())
  if (f.rank !== ALL) params.set('rank', f.rank)
  if (f.vesselType !== ALL) params.set('vesselType', f.vesselType)
  if (f.nationality !== ALL) params.set('nationality', f.nationality)
  if (f.availability !== ALL) params.set('availability', f.availability)
  if (f.minYears.trim() && !isNaN(parseInt(f.minYears, 10))) params.set('minYears', f.minYears.trim())
  const qs = params.toString()
  return qs ? `/api/admin/stats?${qs}` : '/api/admin/stats'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportCsv(seafarers: AdminStatsResponse['seafarers'], t: (k: string, vars?: Record<string, string | number>) => string) {
  const headers = [
    t('admin.name'),
    t('admin.email'),
    t('auth.phone'),
    t('admin.rank'),
    t('admin.nationality'),
    t('admin.availability'),
    t('admin.vesselExp'),
    t('cv.yearsExperience'),
    t('auth.city'),
    t('auth.country'),
    t('admin.registeredDate'),
  ]
  const rows = seafarers.map((s) => [
    s.user.name,
    s.user.email,
    s.user.phone,
    s.rank,
    s.nationality,
    s.availability,
    Array.from(new Set(s.vesselExperiences.map((e) => e.vesselType))).join('; '),
    s.yearsExperience,
    s.user.city,
    s.user.country,
    s.user.createdAt,
  ])
  const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `seafarers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success(t('admin.exportSuccess', { count: seafarers.length }))
}

function FilterSkeleton() {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 flex-1 min-w-[200px]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40" />
        ))}
      </div>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  )
}

export function AdminMasterList() {
  const { t } = useI18n()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selected, setSelected] = useState<SeafarerWithRelations | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Debounce search input 300ms
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(handle)
  }, [filters.search])

  const queryFilters: Filters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['admin', 'stats', queryFilters],
    queryFn: () => api.get<AdminStatsResponse>(buildQueryString(queryFilters)),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const seafarers = data?.seafarers ?? []
  const total = data?.total ?? 0

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.rank !== ALL ||
    filters.vesselType !== ALL ||
    filters.nationality !== ALL ||
    filters.availability !== ALL ||
    filters.minYears.trim() !== ''

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const openDetail = (s: SeafarerWithRelations) => {
    setSelected(s)
    setDialogOpen(true)
  }

  const setField = (field: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [field]: value }))
  }

  return (
    <div>
      <PageHeader
        title={t('admin.masterTitle')}
        subtitle={t('admin.masterSubtitle')}
        icon={<Database className="size-5" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(seafarers, t)}
            disabled={seafarers.length === 0}
          >
            <Download className="size-4" />
            {t('admin.exportCsv')}
          </Button>
        }
      />

      {/* Info note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4 text-sm">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-medium text-primary">{t('admin.filterBy')}</div>
          <div className="text-muted-foreground text-xs mt-0.5">{t('admin.exportNote')}</div>
        </div>
      </div>

      {/* Filter bar */}
      {isLoading && !data ? (
        <FilterSkeleton />
      ) : (
        <Card className="p-4 sm:p-5 mb-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: search + view toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={filters.search}
                  onChange={(e) => setField('search', e.target.value)}
                  placeholder={t('admin.searchPlaceholder')}
                  className="ps-9"
                  aria-label={t('common.search')}
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setField('search', '')}
                    className="absolute top-1/2 -translate-y-1/2 end-2 size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                    aria-label={t('common.clear')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'cards')}>
                  <TabsList>
                    <TabsTrigger value="table" className="gap-1.5">
                      <TableIcon className="size-3.5" />
                      <span className="hidden sm:inline">{t('admin.viewTable')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="gap-1.5">
                      <LayoutGrid className="size-3.5" />
                      <span className="hidden sm:inline">{t('admin.viewCards')}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Row 2: select filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <Select value={filters.rank} onValueChange={(v) => setField('rank', v)}>
                <SelectTrigger className="w-full" aria-label={t('admin.rank')}>
                  <SelectValue placeholder={t('admin.rank')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('common.all')} — {t('admin.rank')}</SelectItem>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.vesselType} onValueChange={(v) => setField('vesselType', v)}>
                <SelectTrigger className="w-full" aria-label={t('admin.vesselExp')}>
                  <SelectValue placeholder={t('admin.vesselExp')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('common.all')} — {t('admin.vesselExp')}</SelectItem>
                  {VESSEL_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.nationality} onValueChange={(v) => setField('nationality', v)}>
                <SelectTrigger className="w-full" aria-label={t('admin.nationality')}>
                  <SelectValue placeholder={t('admin.nationality')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('common.all')} — {t('admin.nationality')}</SelectItem>
                  {NATIONALITIES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.availability} onValueChange={(v) => setField('availability', v)}>
                <SelectTrigger className="w-full" aria-label={t('admin.availability')}>
                  <SelectValue placeholder={t('admin.availability')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('common.all')} — {t('admin.availability')}</SelectItem>
                  {AVAILABILITY_VALUES.map((a) => (
                    <SelectItem key={a} value={a}>{t(`availability.${a}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="0"
                inputMode="numeric"
                value={filters.minYears}
                onChange={(e) => setField('minYears', e.target.value)}
                placeholder={t('admin.minYears')}
                aria-label={t('admin.minYears')}
              />
            </div>

            {/* Row 3: results count + clear */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="tabular-nums">
                  <span className="font-semibold text-foreground">{total}</span>{' '}
                  {t('common.results')}
                </span>
                {isFetching && !isLoading && (
                  <span className="text-xs text-muted-foreground/70">· {t('common.loading')}</span>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
                  <X className="size-3.5" />
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading && !data ? (
        <TableSkeleton />
      ) : seafarers.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Database className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t('common.noResults')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('admin.exportNote')}</p>
        </Card>
      ) : (
        <>
          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="ps-4">{t('admin.name')}</TableHead>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>{t('admin.rank')}</TableHead>
                    <TableHead>{t('admin.nationality')}</TableHead>
                    <TableHead>{t('admin.availability')}</TableHead>
                    <TableHead>{t('admin.vesselExp')}</TableHead>
                    <TableHead className="text-end">{t('admin.yearsExp')}</TableHead>
                    <TableHead>{t('admin.cityCountry')}</TableHead>
                    <TableHead>{t('admin.registeredDate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seafarers.map((s) => {
                    const vesselTypes = Array.from(new Set(s.vesselExperiences.map((e) => e.vesselType)))
                    return (
                      <TableRow
                        key={s.id}
                        onClick={() => openDetail(s)}
                        className="cursor-pointer"
                      >
                        <TableCell className="ps-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px]">{s.user.name}</span>
                            {s._count && s._count.savedBy > 0 && (
                              <Badge variant="secondary" className="text-[10px] font-normal gap-1 shrink-0">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {s._count.savedBy}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="truncate inline-block max-w-[180px] align-bottom">{s.user.email}</span>
                        </TableCell>
                        <TableCell>
                          {s.rank ? (
                            <Badge variant="outline" className="font-normal">{s.rank}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.nationality ?? '—'}</TableCell>
                        <TableCell>
                          <AvailabilityBadge availability={s.availability} t={t} />
                        </TableCell>
                        <TableCell>
                          {vesselTypes.length === 0 ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
                              {vesselTypes.slice(0, 2).map((vt) => (
                                <Badge key={vt} variant="secondary" className="text-[10px] font-normal">
                                  {vt}
                                </Badge>
                              ))}
                              {vesselTypes.length > 2 && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  +{vesselTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{s.yearsExperience ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {[s.user.city, s.user.country].filter(Boolean).join(', ') || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(s.user.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* CARD VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto scrollbar-thin pe-1">
              {seafarers.map((s) => (
                <SeafarerCard
                  key={s.id}
                  seafarer={s}
                  showSaved
                  onClick={() => openDetail(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SeafarerDetailDialog
        seafarer={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
