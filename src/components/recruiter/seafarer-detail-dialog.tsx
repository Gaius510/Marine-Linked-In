'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
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
import {
  Anchor, MapPin, Calendar, Mail, Phone, FileText,
  Award, UserCheck, Users, Clock, Briefcase, Bookmark, ShieldCheck,
} from 'lucide-react'

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
    { label: t('cv.passportNo'), value: profile.passportNo },
    { label: t('cv.passportExpiry'), value: profile.passportExpiry ? formatDate(profile.passportExpiry) : null },
  ].filter((row) => row.value) : []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-[min(64rem,calc(100vw-2rem))]">
          <DialogHeader className="border-b border-border/70 bg-card/95 px-5 py-4 pe-12 text-start">
            <DialogTitle>{profile?.user.name ?? t('browse.detailTitle')}</DialogTitle>
            <DialogDescription>
              {profile ? t('browse.detailDescription', { name: profile.user.name }) : t('browse.detailTitle')}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !profile ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-44 w-full rounded-lg" />
            </div>
          ) : (
            <div className="scrollbar-thin max-h-[calc(92vh-5.75rem)] overflow-y-auto p-5">
              <div className="space-y-5">
                <section className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar className="size-16 shrink-0 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-secondary text-lg font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold tracking-tight">{profile.user.name}</h2>
                          <AvailabilityBadge availability={profile.availability} t={t} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {profile.rank && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Anchor className="size-3.5" />
                              {profile.rank}
                            </span>
                          )}
                          {profile.yearsExperience && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {formatYears(profile.yearsExperience)}
                            </span>
                          )}
                          {profile.nationality && <span>{profile.nationality}</span>}
                          {location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {location}
                            </span>
                          )}
                          {profile.availableFrom && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              {t('browse.availableFrom')}: {formatDate(profile.availableFrom)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        variant={savedByMe ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => saveMutation.mutate({ id: profile.id, save: !savedByMe })}
                        disabled={saveMutation.isPending}
                      >
                        <Bookmark className={savedByMe ? 'fill-current' : ''} />
                        {savedByMe ? t('browse.saved') : t('browse.save')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setMessageOpen(true)}>
                        <Mail className="size-4" />
                        {t('browse.message')}
                      </Button>
                      <Button size="sm" onClick={() => setScheduleOpen(true)}>
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
                      <div className="mt-4 grid gap-2 text-sm">
                        {profile.user.email && (
                          <ContactLine icon={<Mail className="size-4" />} value={profile.user.email} />
                        )}
                        {profile.user.phone && (
                          <ContactLine icon={<Phone className="size-4" />} value={profile.user.phone} />
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard title={t('cv.maritimeInfo')} action={<Award className="size-4 text-primary" />}>
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
                        <StatusPill tone="neutral" className="gap-1">
                          <Users className="size-3.5" />
                          {t('browse.savedByCount', { count: profile._count.savedBy })}
                        </StatusPill>
                        <StatusPill tone="neutral">
                          {t('browse.applicationsCount', { count: profile._count.applications })}
                        </StatusPill>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <SectionCard
                      title={t('browse.experienceOnVessels')}
                      action={<StatusPill tone="primary">{vesselExperiences.length}</StatusPill>}
                    >
                      {vesselExperiences.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('browse.noExperience')}</p>
                      ) : (
                        <div className="space-y-3">
                          {vesselExperiences.map((exp) => (
                            <div key={exp.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-sm">{exp.vesselType}</span>
                                {exp.rank && (
                                  <StatusPill tone="neutral" className="gap-1 text-[11px] font-normal">
                                    <Briefcase className="size-3" />
                                    {exp.rank}
                                  </StatusPill>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {safeText([exp.vesselName, exp.companyName].filter(Boolean).join(' · '), t('common.notProvided'))}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {exp.signOnDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(exp.signOnDate)}
                                    {exp.signOffDate ? ` - ${formatDate(exp.signOffDate)}` : ''}
                                  </span>
                                )}
                                {exp.grossTonnage && <span>GT {exp.grossTonnage}</span>}
                                {exp.tradeArea && <span>{exp.tradeArea}</span>}
                              </div>
                              {(exp.captainName || exp.captainContact || exp.chiefEngName || exp.chiefEngContact) && (
                                <div className="mt-3 rounded-md bg-muted/55 p-2 text-xs text-muted-foreground">
                                  <div className="mb-1 flex items-center gap-1 font-medium text-foreground">
                                    <UserCheck className="size-3" />
                                    {t('browse.supervisorContacts')}
                                  </div>
                                  <div className="grid gap-1 sm:grid-cols-2">
                                    {exp.captainName && (
                                      <div>
                                        <span>{t('cv.captainName')}:</span> {exp.captainName}
                                        {exp.captainContact && ` · ${exp.captainContact}`}
                                      </div>
                                    )}
                                    {exp.chiefEngName && (
                                      <div>
                                        <span>{t('cv.chiefEngName')}:</span> {exp.chiefEngName}
                                        {exp.chiefEngContact && ` · ${exp.chiefEngContact}`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      title={t('browse.certificates')}
                      action={<StatusPill tone="primary">{certificates.length}</StatusPill>}
                    >
                      {certificates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('browse.noCertificates')}</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {certificates.map((cert) => (
                            <div key={cert.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
                              <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
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

function ContactLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function QualRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/45 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  )
}
