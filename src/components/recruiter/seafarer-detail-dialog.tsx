'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { SectionCard } from '@/components/shared/section-card'
import {
  legacyTravelAuthorizationFallbacks,
  TravelAuthorizationSummaryList,
} from '@/components/shared/travel-authorization-summary-list'
import { api } from '@/lib/api'
import { formatDate, formatYears, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { SeafarerWithRelations } from '@/lib/types'
import { MessageDialog } from './message-dialog'
import { ScheduleInterviewDialog } from './schedule-interview-dialog'
import { toast } from 'sonner'
import { Mail, Users, Bookmark, ShieldCheck } from 'lucide-react'

interface SeafarerDetailDialogProps {
  seafarerId: string | null
  onOpenChange: (open: boolean) => void
}

export function SeafarerDetailDialog({ seafarerId, onOpenChange }: SeafarerDetailDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const open = !!seafarerId
  const [messageOpen, setMessageOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['seafarer', seafarerId],
    queryFn: () =>
      api.get<{ profile: SeafarerWithRelations; savedByMe: boolean }>(
        `/api/seafarers/${seafarerId}?id=${seafarerId}`
      ),
    enabled: !!seafarerId,
  })

  const profile = data?.profile
  const vesselExperiences = profile?.vesselExperiences ?? []
  const certificates = profile?.certificates ?? []
  const travelAuthorizations = profile
    ? profile.travelAuthorizations?.length
      ? profile.travelAuthorizations
      : legacyTravelAuthorizationFallbacks(profile)
    : []
  const savedByMe = !!data?.savedByMe
  const initials = profile?.user.name
    ? profile.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : ''
  const location = profile ? [profile.user.city, profile.user.country].filter(Boolean).join(', ') : ''

  const saveMutation = useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) =>
      save
        ? api.post<{ count: number }>('/api/saved', { seafarerId: id })
        : api.del(`/api/saved/${id}?seafarerId=${id}`),
    onSuccess: (_data, vars) => {
      toast.success(t(vars.save ? 'browse.saveSingleSuccess' : 'browse.saveUnsavedSuccess'))
      qc.invalidateQueries({ queryKey: ['seafarer', seafarerId] })
      qc.invalidateQueries({ queryKey: ['seafarers'] })
      qc.invalidateQueries({ queryKey: ['saved'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const qualificationRows = profile ? [
    { label: t('cv.cocGrade'), value: profile.cocGrade },
    { label: t('cv.cocExpiry'), value: profile.cocExpiry ? formatDate(profile.cocExpiry) : null },
    { label: t('cv.passportExpiry'), value: passportReadiness(profile.passportRecorded, profile.passportExpiry, t) },
  ].filter((row) => row.value) : []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[min(64rem,calc(100vw-2rem))]">
          <DialogHeader className="border-b border-border/70 bg-card/95 px-5 py-4 pe-12 text-start">
            <DialogTitle>{profile?.user.name ?? t('browse.detailTitle')}</DialogTitle>
            <DialogDescription>
              {profile ? t('browse.detailDescription', { name: profile.user.name }) : t('browse.detailTitle')}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !profile ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-44 w-full rounded-md" />
            </div>
          ) : (
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="space-y-5">
                <section className="border-b border-border pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start gap-4">
                        <Avatar className="size-14 shrink-0">
                          <AvatarFallback className="bg-secondary text-lg font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight">{profile.user.name}</h2>
                            <AvailabilityBadge availability={profile.availability} t={t} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {profile.rank && <span className="font-medium text-foreground">{profile.rank}</span>}
                            {profile.yearsExperience && <span>{formatYears(profile.yearsExperience)}</span>}
                            {profile.nationality && <span>{profile.nationality}</span>}
                            {location && <span>{location}</span>}
                            {profile.availableFrom && (
                              <span>{t('browse.availableFrom')}: {formatDate(profile.availableFrom)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
                        <ProfileStat
                          label={t('browse.experienceOnVessels')}
                          value={vesselExperiences.length}
                        />
                        <ProfileStat
                          label={t('browse.certificates')}
                          value={certificates.length}
                        />
                        <ProfileStat
                          label={t('travelAuth.readinessTitle')}
                          value={travelAuthorizations.length}
                        />
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => saveMutation.mutate({ id: profile.id, save: !savedByMe })}
                        disabled={saveMutation.isPending}
                      >
                        <Bookmark className={savedByMe ? 'fill-current' : ''} />
                        {savedByMe ? t('browse.saved') : t('browse.save')}
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setMessageOpen(true)}>
                        <Mail className="size-4" />
                        {t('browse.message')}
                      </Button>
                      <Button size="sm" className="w-full sm:w-auto" onClick={() => setScheduleOpen(true)}>
                        <Users className="size-4" />
                        {t('browse.schedule')}
                      </Button>
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="space-y-5">
                    <SectionCard
                      title={t('browse.professionalSummary')}
                      subtitle={t('browse.availabilityAndContact')}
                    >
                      <p className="text-sm leading-6 text-muted-foreground">
                        {safeText(profile.bio, t('common.notProvided'))}
                      </p>
                      <div className="mt-4 border-s-2 border-border px-3 py-2 text-sm text-muted-foreground">
                        {t('privacy.directContactHidden')}
                      </div>
                    </SectionCard>

                    <SectionCard title={t('cv.maritimeInfo')}>
                      {qualificationRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('common.notProvided')}</p>
                      ) : (
                        <div className="grid gap-2 text-sm">
                          {qualificationRows.map((row) => (
                            <QualRow key={row.label} label={row.label} value={row.value} />
                          ))}
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      title={t('travelAuth.readinessTitle')}
                      subtitle={t('travelAuth.readinessDescription')}
                      action={<ShieldCheck className="size-4 text-primary" />}
                    >
                      <TravelAuthorizationSummaryList travelAuthorizations={travelAuthorizations} />
                    </SectionCard>

                    {profile._count && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{t('browse.savedByCount', { count: profile._count.savedBy })}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t('browse.applicationsCount', { count: profile._count.applications })}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <SectionCard
                      title={t('browse.experienceOnVessels')}
                      action={<span className="text-xs tabular-nums text-muted-foreground">{vesselExperiences.length}</span>}
                    >
                      {vesselExperiences.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('browse.noExperience')}</p>
                      ) : (
                        <div className="divide-y divide-border border-y border-border">
                          {vesselExperiences.map((exp) => (
                            <div key={exp.id} className="py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-sm">{exp.vesselType}</span>
                                {exp.rank && <span className="text-xs text-muted-foreground">{exp.rank}</span>}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {safeText([exp.vesselName, exp.companyName].filter(Boolean).join(' · '), t('common.notProvided'))}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {exp.signOnDate && (
                                  <span>
                                    {formatDate(exp.signOnDate)}
                                    {exp.signOffDate ? ` - ${formatDate(exp.signOffDate)}` : ''}
                                  </span>
                                )}
                                {exp.grossTonnage && <span>GT {exp.grossTonnage}</span>}
                                {exp.tradeArea && <span>{exp.tradeArea}</span>}
                              </div>
                              {exp.referenceContactAvailable && (
                                <div className="mt-3 border-s-2 border-border px-2 text-xs text-muted-foreground">
                                  {t('privacy.referencesAvailable')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      title={t('browse.certificates')}
                      action={<span className="text-xs tabular-nums text-muted-foreground">{certificates.length}</span>}
                    >
                      {certificates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('browse.noCertificates')}</p>
                      ) : (
                        <div className="divide-y divide-border border-y border-border">
                          {certificates.map((cert) => (
                            <div key={cert.id} className="py-3">
                              <div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{cert.name}</div>
                                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                    {cert.issuingAuthority && <div>{cert.issuingAuthority}</div>}
                                    {cert.issuedDate && <div>{t('cv.issuedDate')}: {formatDate(cert.issuedDate)}</div>}
                                    {cert.expiryDate && <div>{t('cv.expiryDate')}: {formatDate(cert.expiryDate)}</div>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        seafarerId={profile?.id}
        recipientName={profile?.user.name}
      />
      <ScheduleInterviewDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        seafarerId={profile?.id ?? null}
        seafarerName={profile?.user.name}
      />
    </>
  )
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2 first:ps-0 last:pe-0">
      <div className="truncate text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function passportReadiness(
  passportRecorded: boolean | undefined,
  passportExpiry: string | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (!passportRecorded && !passportExpiry) return t('privacy.passportNotRecorded')
  if (!passportExpiry) return t('privacy.passportExpiryMissing')
  const expiry = new Date(passportExpiry)
  const formatted = formatDate(passportExpiry)
  if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
    return t('privacy.passportExpired', { date: formatted })
  }
  return t('privacy.passportValidUntil', { date: formatted })
}

function QualRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  )
}
