'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
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

  return (
    <div>
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
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Filter className="size-4" />
          <span>{t('common.filter')}</span>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ms-auto h-7 text-xs">
              <X className="size-3" />
              {t('common.clear')}
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="lg:col-span-2 xl:col-span-2">
            <Label className="sr-only" htmlFor="search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder={t('browse.searchPlaceholder')}
                className="ps-9"
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
        <div className="flex items-center gap-2 mt-3 max-w-48">
          <Label htmlFor="min-years" className="text-xs text-muted-foreground shrink-0">
            {t('browse.filterExperience')}
          </Label>
          <Input
            id="min-years"
            type="number"
            min={0}
            value={filters.minYears}
            onChange={(e) => setFilters((f) => ({ ...f, minYears: e.target.value }))}
            placeholder="0"
            className="h-8"
          />
        </div>
      </Card>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-16 z-30 mb-4">
          <Card className="p-3 shadow-md border-primary/30 bg-primary/5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  {selectedCount}
                </div>
                <span>{t('common.selected')}</span>
              </div>
              <div className="flex items-center gap-2 ms-auto">
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
            </div>
          </Card>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {seafarers.length > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => toggleSelectAll(!!v)}
            />
            <span className="text-muted-foreground">
              {allSelected ? t('common.selectAll') : `${seafarers.length} ${t('browse.profilesFound')}`}
            </span>
          </label>
        )}
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : seafarers.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t('browse.noResults')}</p>
          {hasFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              <X className="size-4" />
              {t('common.clear')}
            </Button>
          )}
        </Card>
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
