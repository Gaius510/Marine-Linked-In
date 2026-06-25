'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { EmptyState } from '@/components/shared/empty-state'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MessageDialog } from './message-dialog'
import { ScheduleInterviewDialog } from './schedule-interview-dialog'
import { SeafarerDetailDialog } from './seafarer-detail-dialog'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { SeafarerWithRelations } from '@/lib/types'
import { VESSEL_TYPES, RANKS, NATIONALITIES } from '@/lib/types'
import { Search, X, Bookmark, Mail, Users, Filter, Inbox } from 'lucide-react'

interface BrowseViewProps {
  onPostJob?: () => void
}

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
  rank: 'ALL',
  vesselType: 'ALL',
  nationality: 'ALL',
  availability: 'ALL',
  minYears: '',
}

export function BrowseView({ onPostJob }: BrowseViewProps) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Dialogs state
  const [detailId, setDetailId] = useState<string | null>(null)
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false)
  const [singleMessage, setSingleMessage] = useState<{ id: string; name: string } | null>(null)
  const [scheduleInterview, setScheduleInterview] = useState<{ id: string; name: string } | null>(null)

  // Build query string
  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.search.trim()) p.set('search', filters.search.trim())
    if (filters.rank !== 'ALL') p.set('rank', filters.rank)
    if (filters.vesselType !== 'ALL') p.set('vesselType', filters.vesselType)
    if (filters.nationality !== 'ALL') p.set('nationality', filters.nationality)
    if (filters.availability !== 'ALL') p.set('availability', filters.availability)
    if (filters.minYears) p.set('minYears', filters.minYears)
    return p.toString()
  }, [filters])

  const { data, isLoading } = useQuery({
    queryKey: ['seafarers', queryString],
    queryFn: () =>
      api.get<{ seafarers: SeafarerWithRelations[]; total: number }>(
        `/api/seafarers${queryString ? `?${queryString}` : ''}`
      ),
  })

  const seafarers = data?.seafarers ?? []

  // Toggle individual selection
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  // Select all visible
  const allSelected = seafarers.length > 0 && seafarers.every((s) => selected.has(s.id))
  const someSelected = seafarers.some((s) => selected.has(s.id))

  const toggleSelectAll = useCallback((checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) seafarers.forEach((s) => next.add(s.id))
      else seafarers.forEach((s) => next.delete(s.id))
      return next
    })
  }, [seafarers])

  const clearSelection = () => setSelected(new Set())

  const hasFilters =
    filters.search.trim() ||
    filters.rank !== 'ALL' ||
    filters.vesselType !== 'ALL' ||
    filters.nationality !== 'ALL' ||
    filters.availability !== 'ALL' ||
    filters.minYears

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSelected(new Set())
  }

  // Bulk save mutation
  const bulkSaveMutation = useMutation({
    mutationFn: () => api.post<{ count: number }>('/api/saved', { seafarerIds: Array.from(selected) }),
    onSuccess: (data) => {
      toast.success(t('browse.saveSuccess', { count: data.count }))
      qc.invalidateQueries({ queryKey: ['saved'] })
      qc.invalidateQueries({ queryKey: ['seafarers', queryString] })
      clearSelection()
    },
    onError: () => toast.error(t('common.error')),
  })

  // Single save/unsave mutation (uses queryClient.setQueryData to update cache)
  const saveMutation = useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) =>
      save
        ? api.post<{ count: number }>('/api/saved', { seafarerId: id })
        : api.del(`/api/saved/${id}?seafarerId=${id}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['seafarers'] })
      qc.invalidateQueries({ queryKey: ['saved'] })
      toast.success(t(vars.save ? 'browse.saveSingleSuccess' : 'browse.saveUnsavedSuccess'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const selectedCount = selected.size
  const activeFilters: Array<{ key: keyof Filters; label: string; value: string }> = []

  if (filters.search.trim()) activeFilters.push({ key: 'search', label: t('common.search'), value: filters.search.trim() })
  if (filters.rank !== 'ALL') activeFilters.push({ key: 'rank', label: t('browse.filterRank'), value: filters.rank })
  if (filters.vesselType !== 'ALL') activeFilters.push({ key: 'vesselType', label: t('browse.filterVessel'), value: filters.vesselType })
  if (filters.nationality !== 'ALL') activeFilters.push({ key: 'nationality', label: t('browse.filterNationality'), value: filters.nationality })
  if (filters.availability !== 'ALL') {
    activeFilters.push({
      key: 'availability',
      label: t('browse.filterAvailability'),
      value: t(`availability.${filters.availability}`),
    })
  }
  if (filters.minYears) activeFilters.push({ key: 'minYears', label: t('browse.filterExperience'), value: `${filters.minYears}+` })

  const resultCount = data?.total ?? seafarers.length

  const removeFilter = (key: keyof Filters) => {
    setFilters((current) => ({
      ...current,
      [key]: key === 'search' || key === 'minYears' ? '' : 'ALL',
    }))
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('browse.title')}
        subtitle={t('browse.subtitle')}
        action={
          onPostJob ? (
            <Button onClick={onPostJob} variant="outline" className="h-10">
              {t('common.postJob')}
            </Button>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            {t('common.filter')}
          </span>
        }
        subtitle={hasFilters ? `${activeFilters.length} ${t('common.selected')}` : t('browse.subtitle')}
        action={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              <X className="size-3.5" />
              {t('common.clear')}
            </Button>
          ) : undefined
        }
        className="p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <Label className="sr-only" htmlFor="search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder={t('browse.searchPlaceholder')}
                className="h-10 ps-9"
              />
            </div>
          </div>
          <SelectField
            label={t('browse.filterRank')}
            value={filters.rank}
            onChange={(v) => setFilters((f) => ({ ...f, rank: v }))}
            options={RANKS}
          />
          <SelectField
            label={t('browse.filterVessel')}
            value={filters.vesselType}
            onChange={(v) => setFilters((f) => ({ ...f, vesselType: v }))}
            options={VESSEL_TYPES}
          />
          <SelectField
            label={t('browse.filterNationality')}
            value={filters.nationality}
            onChange={(v) => setFilters((f) => ({ ...f, nationality: v }))}
            options={NATIONALITIES}
          />
          <SelectField
            label={t('browse.filterAvailability')}
            value={filters.availability}
            onChange={(v) => setFilters((f) => ({ ...f, availability: v }))}
            options={['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE']}
            translateOption={(o) => t(`availability.${o}`)}
          />
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-56 space-y-1">
            <Label htmlFor="min-years" className="text-xs text-muted-foreground">
              {t('browse.filterExperience')}
            </Label>
            <Input
              id="min-years"
              type="number"
              min={0}
              value={filters.minYears}
              onChange={(e) => setFilters((f) => ({ ...f, minYears: e.target.value }))}
              placeholder="0"
              className="h-9"
            />
          </div>

          {activeFilters.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
              {activeFilters.map((filter) => (
                <Badge key={filter.key} variant="secondary" className="gap-1.5 rounded-md px-2 py-1 font-normal">
                  <span className="text-muted-foreground">{filter.label}:</span>
                  <span className="max-w-[11rem] truncate">{filter.value}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter(filter.key)}
                    className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${t('common.clear')} ${filter.label}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-16 z-30">
          <Card className="border-primary/30 bg-primary/5 p-3 shadow-md">
            <PageToolbar>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {selectedCount}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{t('browse.selected', { count: selectedCount })}</div>
                  <div className="text-xs text-muted-foreground">
                    {resultCount} {t('browse.profilesFound')}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => bulkSaveMutation.mutate()}
                  disabled={bulkSaveMutation.isPending}
                >
                  <Bookmark className="size-4" />
                  {t('browse.saveSelected')}
                </Button>
                <Button
                  size="sm"
                  className="h-9"
                  onClick={() => setBulkMessageOpen(true)}
                >
                  <Mail className="size-4" />
                  {t('browse.messageSelected')}
                </Button>
                <Button variant="ghost" size="sm" className="h-9" onClick={clearSelection}>
                  <X className="size-4" />
                  {t('browse.clearSelection')}
                </Button>
              </div>
            </PageToolbar>
          </Card>
        </div>
      )}

      {/* Results header */}
      <PageToolbar className="px-1">
        <div className="text-sm text-muted-foreground">
          {isLoading ? t('common.loading') : `${resultCount} ${t('browse.profilesFound')}`}
          {hasFilters && !isLoading ? ` · ${activeFilters.length} ${t('common.filter')}` : ''}
        </div>
        {seafarers.length > 0 ? (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => toggleSelectAll(!!v)}
            />
            <span className="text-muted-foreground">
              {allSelected ? t('browse.clearSelection') : t('common.selectAll')}
            </span>
          </label>
        ) : <div />}
      </PageToolbar>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : seafarers.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('browse.noResults')}
          description={hasFilters ? `${activeFilters.length} ${t('common.filter')}` : undefined}
          action={hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="size-4" />
              {t('common.clear')}
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seafarers.map((sf) => {
            const isSaved = !!sf.savedByMe
            return (
              <SeafarerCard
                key={sf.id}
                seafarer={sf}
                selectable
                selected={selected.has(sf.id)}
                onSelect={(checked) => toggleSelect(sf.id, checked)}
                onClick={() => setDetailId(sf.id)}
                showSaved
                actions={
                  <>
                    <Button
                      variant={isSaved ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => saveMutation.mutate({ id: sf.id, save: !isSaved })}
                      disabled={saveMutation.isPending}
                    >
                      <Bookmark className={isSaved ? 'fill-current' : ''} />
                      {isSaved ? t('browse.saved') : t('browse.save')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setSingleMessage({ id: sf.id, name: sf.user.name })}
                    >
                      <Mail className="size-4" />
                      {t('browse.message')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setScheduleInterview({ id: sf.id, name: sf.user.name })}
                      aria-label={t('browse.schedule')}
                    >
                      <Users className="size-4" />
                    </Button>
                  </>
                }
              />
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
      <MessageDialog
        open={bulkMessageOpen}
        onOpenChange={setBulkMessageOpen}
        seafarerIds={selectedCount > 0 ? Array.from(selected) : []}
        onBulkSuccess={clearSelection}
      />
      <MessageDialog
        open={!!singleMessage}
        onOpenChange={(o) => !o && setSingleMessage(null)}
        seafarerId={singleMessage?.id}
        recipientName={singleMessage?.name}
      />
      <ScheduleInterviewDialog
        open={!!scheduleInterview}
        onOpenChange={(o) => !o && setScheduleInterview(null)}
        seafarerId={scheduleInterview?.id ?? null}
        seafarerName={scheduleInterview?.name}
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  translateOption?: (o: string) => string
}

function SelectField({ label, value, onChange, options, translateOption }: SelectFieldProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('common.all')}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {translateOption ? translateOption(opt) : opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
