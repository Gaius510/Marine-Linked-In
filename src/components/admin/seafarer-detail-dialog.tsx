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
import { Card } from '@/components/ui/card'
import { AvailabilityBadge } from '@/components/shared/availability-badge'
import { useI18n } from '@/lib/i18n'
import type { SeafarerWithOptionalRelations } from '@/lib/types'
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
  icon: typeof Anchor
  label: string
  value: string | null | undefined
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-sm break-words">
          {value && value.trim() !== '' ? value : <span className="text-muted-foreground italic">{t('admin.notSpecified')}</span>}
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function SeafarerDetailDialog({ seafarer, open, onOpenChange }: SeafarerDetailDialogProps) {
  const { t } = useI18n()
  if (!seafarer) return null

  const initials = seafarer.user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const savedBy = seafarer._count?.savedBy ?? 0
  const applications = seafarer._count?.applications ?? 0
  const vesselExperiences = seafarer.vesselExperiences ?? []
  const certificates = seafarer.certificates ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="sr-only">{t('admin.seafarerDetails')}</DialogTitle>
          <DialogDescription className="sr-only">{seafarer.user.name}</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-xl bg-primary/10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg rounded-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{seafarer.user.name}</h2>
            {seafarer.rank && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Anchor className="size-3.5" />
                {seafarer.rank}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <AvailabilityBadge availability={seafarer.availability} t={t} />
              {seafarer.nationality && (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Globe className="size-3" />
                  {seafarer.nationality}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/60 p-3 flex items-center gap-2">
            <Bookmark className="size-4 text-primary shrink-0" />
            <div>
              <div className="text-lg font-bold tabular-nums">{savedBy}</div>
              <div className="text-[11px] text-muted-foreground">{t('nav.saved')}</div>
            </div>
          </div>
          <div className="rounded-lg bg-muted/60 p-3 flex items-center gap-2">
            <Send className="size-4 text-primary shrink-0" />
            <div>
              <div className="text-lg font-bold tabular-nums">{applications}</div>
              <div className="text-[11px] text-muted-foreground">{t('admin.totalApplications')}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Personal info */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            {t('cv.personalInfo')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <InfoRow icon={Mail} label={t('admin.email')} value={seafarer.user.email} />
            <InfoRow icon={Phone} label={t('auth.phone')} value={seafarer.user.phone} />
            <InfoRow icon={MapPin} label={t('admin.cityCountry')} value={[seafarer.user.city, seafarer.user.country].filter(Boolean).join(', ') || null} />
            <InfoRow icon={Calendar} label={t('cv.dateOfBirth')} value={formatDate(seafarer.dateOfBirth)} />
          </div>
          {seafarer.bio && (
            <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              {seafarer.bio}
            </div>
          )}
        </section>

        <Separator />

        {/* Maritime info */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Anchor className="size-4 text-primary" />
            {t('cv.maritimeInfo')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <InfoRow icon={Anchor} label={t('cv.rank')} value={seafarer.rank} />
            <InfoRow icon={Calendar} label={t('cv.availableFrom')} value={formatDate(seafarer.availableFrom)} />
            <InfoRow icon={Award} label={t('cv.yearsExperience')} value={seafarer.yearsExperience} />
            <InfoRow icon={FileText} label={t('cv.cocGrade')} value={seafarer.cocGrade} />
            <InfoRow icon={Calendar} label={t('cv.cocExpiry')} value={formatDate(seafarer.cocExpiry)} />
            <InfoRow icon={FileText} label={t('cv.passportNo')} value={seafarer.passportNo} />
            <InfoRow icon={Calendar} label={t('cv.passportExpiry')} value={formatDate(seafarer.passportExpiry)} />
            <InfoRow icon={Globe} label={t('cv.usVisa')} value={seafarer.usVisa} />
            <InfoRow icon={Globe} label={t('cv.schengenVisa')} value={seafarer.schengenVisa} />
          </div>
        </section>

        <Separator />

        {/* Vessel experiences */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Ship className="size-4 text-primary" />
              {t('cv.vesselExperience')}
            </span>
            <Badge variant="secondary" className="font-normal">
              {t('admin.experiencesCount', { count: vesselExperiences.length })}
            </Badge>
          </h3>
          {vesselExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('admin.noExperiences')}</p>
          ) : (
            <div className="space-y-3">
              {vesselExperiences.map((exp) => (
                <Card key={exp.id} className="p-4 gap-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Ship className="size-3" />
                          {exp.vesselType}
                        </Badge>
                        {exp.rank && (
                          <Badge variant="outline" className="font-normal gap-1">
                            <Anchor className="size-3" />
                            {exp.rank}
                          </Badge>
                        )}
                      </div>
                      {exp.vesselName && (
                        <div className="font-medium text-sm mt-1.5">{exp.vesselName}</div>
                      )}
                    </div>
                    {(exp.signOnDate || exp.signOffDate) && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowRightLeft className="size-3" />
                        {[formatDate(exp.signOnDate), formatDate(exp.signOffDate)].filter(Boolean).join(' — ')}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs">
                    <InfoRow icon={Building2} label={t('cv.companyName')} value={exp.companyName} />
                    <InfoRow icon={FileText} label={t('cv.imoNumber')} value={exp.imoNumber} />
                    <InfoRow icon={Weight} label={t('cv.grossTonnage')} value={exp.grossTonnage} />
                    <InfoRow icon={Cog} label={t('cv.engineType')} value={exp.engineType} />
                    <InfoRow icon={Compass} label={t('cv.tradeArea')} value={exp.tradeArea} />
                  </div>
                  {(exp.captainName || exp.captainContact || exp.chiefEngName || exp.chiefEngContact) && (
                    <>
                      <Separator />
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('admin.supervisorContacts')}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs">
                        <InfoRow icon={ShipWheel} label={t('cv.captainName')} value={exp.captainName} />
                        <InfoRow icon={PhoneCall} label={t('cv.captainContact')} value={exp.captainContact} />
                        <InfoRow icon={Cog} label={t('cv.chiefEngName')} value={exp.chiefEngName} />
                        <InfoRow icon={PhoneCall} label={t('cv.chiefEngContact')} value={exp.chiefEngContact} />
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Certificates */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              {t('cv.certificates')}
            </span>
            <Badge variant="secondary" className="font-normal">
              {t('admin.certificatesCount', { count: certificates.length })}
            </Badge>
          </h3>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('admin.noCertificates')}</p>
          ) : (
            <div className="space-y-2">
              {certificates.map((cert) => (
                <div key={cert.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium text-sm">{cert.name}</div>
                    {(cert.issuedDate || cert.expiryDate) && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {[formatDate(cert.issuedDate), formatDate(cert.expiryDate)].filter(Boolean).join(' — ')}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-1">
                    <InfoRow icon={FileText} label={t('cv.certNumber')} value={cert.number} />
                    <InfoRow icon={Building2} label={t('cv.issuingAuthority')} value={cert.issuingAuthority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}
