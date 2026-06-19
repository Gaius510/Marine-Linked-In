'use client'

import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { SeafarerWithRelations } from '@/lib/types'
import {
  Anchor, MapPin, Calendar, Ship, Mail, Phone, FileText,
  Award, UserCheck, Users, Clock, Briefcase,
} from 'lucide-react'

interface SeafarerDetailDialogProps {
  seafarerId: string | null
  onOpenChange: (open: boolean) => void
}

export function SeafarerDetailDialog({ seafarerId, onOpenChange }: SeafarerDetailDialogProps) {
  const { t } = useI18n()
  const open = !!seafarerId

  const { data, isLoading } = useQuery({
    queryKey: ['seafarer', seafarerId],
    queryFn: () =>
      api.get<{ profile: SeafarerWithRelations; savedByMe: boolean }>(
        `/api/seafarers/${seafarerId}?id=${seafarerId}`
      ),
    enabled: !!seafarerId,
  })

  const profile = data?.profile
  const initials = profile?.user.name
    ? profile.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{t('browse.detailTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('browse.detailTitle')}</DialogDescription>
        </DialogHeader>

        {isLoading || !profile ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="size-16 rounded-xl bg-primary/10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold rounded-xl text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{profile.user.name}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                  {profile.rank && (
                    <span className="flex items-center gap-1">
                      <Anchor className="size-3.5" />
                      {profile.rank}
                    </span>
                  )}
                  {profile.yearsExperience && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {profile.yearsExperience} {t('browse.experience')}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  {profile.nationality && <span>{profile.nationality}</span>}
                  {(profile.user.city || profile.user.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {[profile.user.city, profile.user.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.availableFrom && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {profile.availableFrom}
                    </span>
                  )}
                </div>
              </div>
              <AvailabilityBadge availability={profile.availability} t={t} />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {profile.user.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 text-primary" />
                  <span className="truncate">{profile.user.email}</span>
                </div>
              )}
              {profile.user.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 text-primary" />
                  <span>{profile.user.phone}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">{t('cv.bio')}</div>
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              </Card>
            )}

            {/* Maritime qualifications */}
            <Card className="p-4">
              <div className="flex items-center gap-2 font-medium mb-3">
                <Award className="size-4 text-primary" />
                {t('cv.maritimeInfo')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <QualRow label={t('cv.cocGrade')} value={profile.cocGrade} />
                <QualRow label={t('cv.cocExpiry')} value={profile.cocExpiry} />
                <QualRow label={t('cv.passportNo')} value={profile.passportNo} />
                <QualRow label={t('cv.passportExpiry')} value={profile.passportExpiry} />
                <QualRow label={t('cv.usVisa')} value={profile.usVisa} />
                <QualRow label={t('cv.schengenVisa')} value={profile.schengenVisa} />
              </div>
            </Card>

            {/* Vessel experience */}
            <Card className="p-4">
              <div className="flex items-center gap-2 font-medium mb-3">
                <Ship className="size-4 text-primary" />
                {t('browse.experienceOnVessels')}
                <Badge variant="secondary" className="ms-auto text-[11px]">
                  {profile.vesselExperiences.length}
                </Badge>
              </div>
              {profile.vesselExperiences.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('browse.noExperience')}</p>
              ) : (
                <div className="space-y-3">
                  {profile.vesselExperiences.map((exp) => (
                    <div key={exp.id} className="border-s-2 border-primary/30 ps-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-medium text-sm">{exp.vesselType}</span>
                        {exp.vesselName && <span className="text-sm text-muted-foreground">· {exp.vesselName}</span>}
                        {exp.rank && (
                          <Badge variant="outline" className="text-[11px] gap-1 font-normal">
                            <Briefcase className="size-3" />
                            {exp.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        {exp.companyName && <span>{exp.companyName}</span>}
                        {exp.signOnDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {exp.signOnDate}{exp.signOffDate ? ` → ${exp.signOffDate}` : ''}
                          </span>
                        )}
                        {exp.grossTonnage && <span>GT {exp.grossTonnage}</span>}
                        {exp.tradeArea && <span>{exp.tradeArea}</span>}
                      </div>
                      {(exp.captainName || exp.captainContact || exp.chiefEngName || exp.chiefEngContact) && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                          <div className="flex items-center gap-1 font-medium text-foreground mb-1">
                            <UserCheck className="size-3" />
                            {t('browse.supervisorContacts')}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                            {exp.captainName && (
                              <div>
                                <span className="text-muted-foreground/70">{t('cv.captainName')}:</span> {exp.captainName}
                                {exp.captainContact && ` · ${exp.captainContact}`}
                              </div>
                            )}
                            {exp.chiefEngName && (
                              <div>
                                <span className="text-muted-foreground/70">{t('cv.chiefEngName')}:</span> {exp.chiefEngName}
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
            </Card>

            {/* Certificates */}
            <Card className="p-4">
              <div className="flex items-center gap-2 font-medium mb-3">
                <FileText className="size-4 text-primary" />
                {t('browse.certificates')}
                <Badge variant="secondary" className="ms-auto text-[11px]">
                  {profile.certificates.length}
                </Badge>
              </div>
              {profile.certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('browse.noCertificates')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profile.certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-md p-2.5">
                      <div className="font-medium text-sm">{cert.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {cert.issuingAuthority && <div>{cert.issuingAuthority}</div>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {cert.issuedDate && <span>{t('cv.issuedDate')}: {cert.issuedDate}</span>}
                          {cert.expiryDate && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {t('cv.expiryDate')}: {cert.expiryDate}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {profile._count && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {profile._count.savedBy} recruiters saved
                </span>
                <span>·</span>
                <span>{profile._count.applications} applications</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function QualRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  )
}
