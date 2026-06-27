'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import {
  legacyTravelAuthorizationFallbacks,
  TravelAuthorizationSummaryList,
} from '@/components/shared/travel-authorization-summary-list'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatYears, safeText } from '@/lib/format'
import type { SeafarerWithOptionalRelations } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Ship,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Globe,
  Award,
  FileText,
  Building2,
  Weight,
  Cog,
  Compass,
  ArrowRightLeft,
  UserCheck,
  Send,
  Bookmark,
  PhoneCall,
  ShipWheel,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react'

interface SeafarerDetailDialogProps {
  seafarer: SeafarerWithOptionalRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number | null | undefined
}) {
  const { t } = useI18n()
  const display = safeText(value, '')

  return (
    <div className="flex items-start gap-2.5 rounded-lg px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="break-words text-sm">
          {display ? display : <span className="text-muted-foreground italic">{t('admin.notSpecified')}</span>}
        </div>
      </div>
    </div>
  )
}

function joined(values: Array<string | null | undefined>): string | null {
  const text = values.filter(Boolean).join(', ')
  return text || null
}

export function SeafarerDetailDialog({ seafarer, open, onOpenChange }: SeafarerDetailDialogProps) {
  const { t } = useI18n()
  if (!seafarer) return null

  const vesselExperiences = seafarer.vesselExperiences ?? []
  const certificates = seafarer.certificates ?? []
  const travelAuthorizations = seafarer.travelAuthorizations?.length
    ? seafarer.travelAuthorizations
    : legacyTravelAuthorizationFallbacks(seafarer)
  const savedBy = seafarer._count?.savedBy ?? 0
  const applications = seafarer._count?.applications ?? 0
  const initials = seafarer.user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[min(64rem,calc(100vw-2rem))]">
        <DialogHeader className="border-b bg-secondary/35 px-5 py-4 sm:px-6">
          <DialogTitle>{t('admin.seafarerDetails')}</DialogTitle>
          <DialogDescription>{seafarer.user.name}</DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <section className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/95 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="size-16 shrink-0 rounded-xl bg-primary/10">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-bold">{seafarer.user.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Anchor className="size-3.5" />
                      {safeText(seafarer.rank, t('admin.notSpecified'))}
                    </span>
                    {seafarer.nationality && (
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="size-3.5" />
                        {seafarer.nationality}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <AvailabilityBadge availability={seafarer.availability} t={t} />
                    <StatusPill tone="neutral">{formatYears(seafarer.yearsExperience, t('admin.notSpecified'))}</StatusPill>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:w-56">
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bookmark className="size-3.5" />
                    {t('nav.saved')}
                  </div>
                  <div className="mt-1 text-lg font-bold tabular-nums">{savedBy}</div>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Send className="size-3.5" />
                    {t('admin.totalApplications')}
                  </div>
                  <div className="mt-1 text-lg font-bold tabular-nums">{applications}</div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-5">
                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <UserCheck className="size-4 text-primary" />
                      {t('admin.accountContact')}
                    </span>
                  }
                  subtitle={t('admin.accountContactDesc')}
                >
                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2 xl:grid-cols-1">
                    <InfoRow icon={Mail} label={t('admin.email')} value={seafarer.user.email} />
                    <InfoRow icon={Phone} label={t('auth.phone')} value={seafarer.user.phone} />
                    <InfoRow icon={MapPin} label={t('admin.cityCountry')} value={joined([seafarer.user.city, seafarer.user.country])} />
                    <InfoRow icon={Calendar} label={t('cv.dateOfBirth')} value={formatDate(seafarer.dateOfBirth, '')} />
                  </div>
                  {seafarer.bio && (
                    <>
                      <Separator className="my-3" />
                      <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{seafarer.bio}</p>
                    </>
                  )}
                </SectionCard>

                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Anchor className="size-4 text-primary" />
                      {t('admin.maritimeQualifications')}
                    </span>
                  }
                  subtitle={t('admin.maritimeQualificationsDesc')}
                >
                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2 xl:grid-cols-1">
                    <InfoRow icon={Anchor} label={t('cv.rank')} value={seafarer.rank} />
                    <InfoRow icon={Calendar} label={t('cv.availableFrom')} value={formatDate(seafarer.availableFrom, '')} />
                    <InfoRow icon={Award} label={t('cv.yearsExperience')} value={formatYears(seafarer.yearsExperience, '')} />
                    <InfoRow icon={FileText} label={t('cv.cocGrade')} value={seafarer.cocGrade} />
                    <InfoRow icon={Calendar} label={t('cv.cocExpiry')} value={formatDate(seafarer.cocExpiry, '')} />
                    <InfoRow icon={FileText} label={t('cv.passportNo')} value={seafarer.passportNo} />
                    <InfoRow icon={Calendar} label={t('cv.passportExpiry')} value={formatDate(seafarer.passportExpiry, '')} />
                  </div>
                </SectionCard>

                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      {t('travelAuth.readinessTitle')}
                    </span>
                  }
                  subtitle={t('travelAuth.readinessDescription')}
                >
                  <TravelAuthorizationSummaryList travelAuthorizations={travelAuthorizations} />
                </SectionCard>
              </div>

              <div className="space-y-5">
                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Ship className="size-4 text-primary" />
                      {t('cv.vesselExperience')}
                    </span>
                  }
                  subtitle={t('admin.vesselExperienceDesc')}
                  action={<StatusPill tone="neutral">{t('admin.experiencesCount', { count: vesselExperiences.length })}</StatusPill>}
                >
                  {vesselExperiences.length === 0 ? (
                    <EmptyState icon={Ship} title={t('admin.noExperiences')} framed={false} />
                  ) : (
                    <div className="space-y-3">
                      {vesselExperiences.map((experience) => (
                        <article key={experience.id} className="rounded-xl border border-border/80 bg-background/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="gap-1 font-normal">
                                  <Ship className="size-3" />
                                  {safeText(experience.vesselType, t('admin.notSpecified'))}
                                </Badge>
                                {experience.rank && (
                                  <Badge variant="outline" className="gap-1 font-normal">
                                    <Anchor className="size-3" />
                                    {experience.rank}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="mt-2 text-sm font-semibold">{safeText(experience.vesselName, t('admin.notSpecified'))}</h3>
                              <p className="text-xs text-muted-foreground">{safeText(experience.companyName, t('admin.notSpecified'))}</p>
                            </div>
                            {(experience.signOnDate || experience.signOffDate) && (
                              <StatusPill tone="neutral" className="gap-1">
                                <ArrowRightLeft className="size-3" />
                                {[formatDate(experience.signOnDate, ''), formatDate(experience.signOffDate, '')].filter(Boolean).join(' - ')}
                              </StatusPill>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                            <InfoRow icon={FileText} label={t('cv.imoNumber')} value={experience.imoNumber} />
                            <InfoRow icon={Weight} label={t('cv.grossTonnage')} value={experience.grossTonnage} />
                            <InfoRow icon={Cog} label={t('cv.engineType')} value={experience.engineType} />
                            <InfoRow icon={Compass} label={t('cv.tradeArea')} value={experience.tradeArea} />
                          </div>

                          {(experience.captainName || experience.captainContact || experience.chiefEngName || experience.chiefEngContact) && (
                            <>
                              <Separator className="my-3" />
                              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('admin.supervisorContacts')}
                              </div>
                              <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                                <InfoRow icon={ShipWheel} label={t('cv.captainName')} value={experience.captainName} />
                                <InfoRow icon={PhoneCall} label={t('cv.captainContact')} value={experience.captainContact} />
                                <InfoRow icon={Cog} label={t('cv.chiefEngName')} value={experience.chiefEngName} />
                                <InfoRow icon={PhoneCall} label={t('cv.chiefEngContact')} value={experience.chiefEngContact} />
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Award className="size-4 text-primary" />
                      {t('cv.certificates')}
                    </span>
                  }
                  subtitle={t('admin.certificatesDesc')}
                  action={<StatusPill tone="neutral">{t('admin.certificatesCount', { count: certificates.length })}</StatusPill>}
                >
                  {certificates.length === 0 ? (
                    <EmptyState icon={ClipboardList} title={t('admin.noCertificates')} framed={false} />
                  ) : (
                    <div className="space-y-2">
                      {certificates.map((certificate) => (
                        <article key={certificate.id} className="rounded-xl border border-border/80 bg-background/60 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold">{safeText(certificate.name, t('admin.notSpecified'))}</h3>
                              <p className="text-xs text-muted-foreground">{safeText(certificate.issuingAuthority, t('admin.notSpecified'))}</p>
                            </div>
                            {(certificate.issuedDate || certificate.expiryDate) && (
                              <StatusPill tone="neutral" className="gap-1">
                                <Calendar className="size-3" />
                                {[formatDate(certificate.issuedDate, ''), formatDate(certificate.expiryDate, '')].filter(Boolean).join(' - ')}
                              </StatusPill>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                            <InfoRow icon={FileText} label={t('cv.certNumber')} value={certificate.number} />
                            <InfoRow icon={Building2} label={t('cv.issuingAuthority')} value={certificate.issuingAuthority} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
