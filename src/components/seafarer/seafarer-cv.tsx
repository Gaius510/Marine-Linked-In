'use client'

import { useMemo, useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { SeafarerWithRelations, VesselExperience, Certificate, Availability } from '@/lib/types'
import { RANKS, NATIONALITIES } from '@/lib/types'
import { PageHeader } from '@/components/shared/page-header'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { ExperienceDialog } from '@/components/seafarer/experience-dialog'
import { CertificateDialog } from '@/components/seafarer/certificate-dialog'
import { computeCompleteness, strengthKey } from '@/components/seafarer/profile-completeness'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Ship, Award, FileText, Anchor, IdCard, Save, Plus, Pencil, Trash2,
  Loader2, Info, User as UserIcon, CalendarClock, MapPin, Anchor as AnchorIcon,
} from 'lucide-react'

type TabKey = 'personal' | 'maritime' | 'experience' | 'certificates' | 'documents'

export function SeafarerCV() {
  const { t } = useI18n()
  const { data, isLoading } = useSeafarerProfile()
  const profile = data?.profile

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return <CVBody profile={profile} />
}

function CVBody({ profile }: { profile: SeafarerWithRelations & { applications: unknown[] } }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<TabKey>('personal')

  const pct = useMemo(() => computeCompleteness(profile), [profile])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('cv.title')}
        subtitle={t('seafarer.completeCvDesc')}
        icon={<FileText className="size-5" />}
        action={
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <span className="text-xs text-muted-foreground">{t('seafarer.profileStrength')}:</span>
            <span className="font-bold text-foreground">{pct}%</span>
          </Badge>
        }
      />

      {/* Profile strength progress (always visible) */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Anchor className="size-4 text-primary" />
              <h3 className="font-semibold">{t('seafarer.cvProgress')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{t(strengthKey(pct))}</p>
            <Progress value={pct} className="mt-3" />
          </div>
          <div className="text-3xl font-bold text-primary shrink-0 sm:ps-4 sm:border-s">
            {pct}%
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger value="personal" className="gap-1.5"><IdCard className="size-4" />{t('cv.personalInfo')}</TabsTrigger>
          <TabsTrigger value="maritime" className="gap-1.5"><AnchorIcon className="size-4" />{t('cv.maritimeInfo')}</TabsTrigger>
          <TabsTrigger value="experience" className="gap-1.5"><Ship className="size-4" />{t('cv.vesselExperience')}</TabsTrigger>
          <TabsTrigger value="certificates" className="gap-1.5"><Award className="size-4" />{t('cv.certificates')}</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="size-4" />{t('cv.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <PersonalInfoTab profile={profile} />
        </TabsContent>
        <TabsContent value="maritime" className="mt-4">
          <MaritimeInfoTab profile={profile} />
        </TabsContent>
        <TabsContent value="experience" className="mt-4">
          <ExperienceTab profile={profile} />
        </TabsContent>
        <TabsContent value="certificates" className="mt-4">
          <CertificatesTab profile={profile} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Personal info                                                       */
/* ------------------------------------------------------------------ */

interface PersonalForm {
  phone: string
  city: string
  country: string
  nationality: string
  dateOfBirth: string
  bio: string
}

function PersonalInfoTab({ profile }: { profile: SeafarerWithRelations }) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const [form, setForm] = useState<PersonalForm>(() => ({
    phone: profile.user.phone || '',
    city: profile.user.city || '',
    country: profile.user.country || '',
    nationality: profile.nationality || '',
    dateOfBirth: profile.dateOfBirth || '',
    bio: profile.bio || '',
  }))
  // Reset form when the profile reference changes (after a refetch).
  const [lastProfile, setLastProfile] = useState(profile)
  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm({
      phone: profile.user.phone || '',
      city: profile.user.city || '',
      country: profile.user.country || '',
      nationality: profile.nationality || '',
      dateOfBirth: profile.dateOfBirth || '',
      bio: profile.bio || '',
    })
  }

  const mutation = useMutation({
    mutationFn: (body: Partial<PersonalForm>) => api.put('/api/seafarers/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('cv.savedSuccess'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const set = <K extends keyof PersonalForm>(k: K, v: PersonalForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        icon={<UserIcon className="size-4" />}
        title={t('cv.personalInfo')}
        hint={t('cv.personalInfoHint')}
      />

      <form
        className="space-y-5 mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(form)
        }}
      >
        {/* Read-only display name + email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <ReadOnlyField label={t('auth.name')} value={profile.user.name} />
          <ReadOnlyField label={t('auth.email')} value={profile.user.email} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('auth.phone')}>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
          </Field>
          <Field label={t('cv.nationality')}>
            <Select value={form.nationality} onValueChange={(v) => set('nationality', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t('cv.nationality')} /></SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('auth.city')}>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label={t('auth.country')}>
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} />
          </Field>
          <Field label={t('cv.dateOfBirth')}>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </Field>
        </div>

        <Field label={t('cv.bio')}>
          <Textarea rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)}
            placeholder="Short professional summary — your expertise, trade areas, languages…" />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Maritime qualifications                                             */
/* ------------------------------------------------------------------ */

interface MaritimeForm {
  rank: string
  availability: Availability
  availableFrom: string
  yearsExperience: string
  cocGrade: string
  cocExpiry: string
}

function MaritimeInfoTab({ profile }: { profile: SeafarerWithRelations }) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const [form, setForm] = useState<MaritimeForm>(() => ({
    rank: profile.rank || '',
    availability: profile.availability || 'AVAILABLE',
    availableFrom: profile.availableFrom || '',
    yearsExperience: profile.yearsExperience || '',
    cocGrade: profile.cocGrade || '',
    cocExpiry: profile.cocExpiry || '',
  }))
  const [lastProfile, setLastProfile] = useState(profile)
  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm({
      rank: profile.rank || '',
      availability: profile.availability || 'AVAILABLE',
      availableFrom: profile.availableFrom || '',
      yearsExperience: profile.yearsExperience || '',
      cocGrade: profile.cocGrade || '',
      cocExpiry: profile.cocExpiry || '',
    })
  }

  const mutation = useMutation({
    mutationFn: (body: Partial<MaritimeForm>) => api.put('/api/seafarers/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('cv.savedSuccess'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const set = <K extends keyof MaritimeForm>(k: K, v: MaritimeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const availabilityOptions: Availability[] = ['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE']

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        icon={<AnchorIcon className="size-4" />}
        title={t('cv.maritimeInfo')}
        hint={t('cv.maritimeInfoHint')}
      />

      <form
        className="space-y-5 mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(form)
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('cv.rank')}>
            <Select value={form.rank} onValueChange={(v) => set('rank', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t('cv.rank')} /></SelectTrigger>
              <SelectContent>
                {RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('cv.yearsExperience')}>
            <Input type="number" min={0} max={70} value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value)} />
          </Field>
          <Field label={t('cv.cocGrade')}>
            <Input value={form.cocGrade} onChange={(e) => set('cocGrade', e.target.value)}
              placeholder="e.g. II/2 Chief Mate" />
          </Field>
          <Field label={t('cv.cocExpiry')}>
            <Input type="date" value={form.cocExpiry} onChange={(e) => set('cocExpiry', e.target.value)} />
          </Field>
        </div>

        <Separator />

        <Field label={t('cv.availability')}>
          <RadioGroup
            value={form.availability}
            onValueChange={(v) => set('availability', v as Availability)}
            className="grid sm:grid-cols-3 gap-3"
          >
            {availabilityOptions.map((opt) => (
              <label
                key={opt}
                htmlFor={`avail-${opt}`}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem id={`avail-${opt}`} value={opt} />
                <span className="text-sm font-medium">{t(`availability.${opt}`)}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>

        {form.availability === 'AVAILABLE' && (
          <Field label={t('cv.availableFrom')}>
            <Input type="date" value={form.availableFrom}
              onChange={(e) => set('availableFrom', e.target.value)} className="sm:max-w-xs" />
          </Field>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Vessel experience                                                   */
/* ------------------------------------------------------------------ */

function ExperienceTab({ profile }: { profile: SeafarerWithRelations }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VesselExperience | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const experiences = profile.vesselExperiences

  const delMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/seafarers/me/experiences/${id}?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('common.success'))
      setDeleteId(null)
    },
    onError: () => toast.error(t('common.error')),
  })

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (e: VesselExperience) => { setEditing(e); setDialogOpen(true) }

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        icon={<Ship className="size-4" />}
        title={t('cv.vesselExperience')}
        hint={t('cv.experienceHint')}
        action={
          <Button onClick={openAdd} size="sm">
            <Plus className="size-4" /> {t('cv.addExperience')}
          </Button>
        }
      />

      {/* Info banner */}
      <div className="mt-4 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-medium">{t('cv.selectMultipleVessels')}</p>
          <p className="text-muted-foreground">{t('cv.experienceHint')}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('cv.experienceCount', { count: experiences.length })}</span>
      </div>

      {experiences.length === 0 ? (
        <EmptyState
          icon={<Ship className="size-8" />}
          title={t('cv.noExperience')}
          action={
            <Button onClick={openAdd} variant="outline" size="sm">
              <Plus className="size-4" /> {t('cv.addExperience')}
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {experiences.map((e) => (
            <ExperienceCard
              key={e.id}
              exp={e}
              onEdit={() => openEdit(e)}
              onDelete={() => setDeleteId(e.id)}
            />
          ))}
        </ul>
      )}

      <ExperienceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        experience={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cv.deleteExperienceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cv.deleteExperienceDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMutation.mutate(deleteId)}
              disabled={delMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {delMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function ExperienceCard({
  exp, onEdit, onDelete,
}: {
  exp: VesselExperience
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

  return (
    <li className="rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Ship className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold truncate">{exp.vesselName || exp.vesselType}</h4>
              <Badge variant="secondary" className="text-[10px]">{exp.vesselType}</Badge>
              {exp.rank && <Badge variant="outline" className="text-[10px]">{exp.rank}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              {exp.companyName && (
                <span className="flex items-center gap-1"><MapPin className="size-3" />{exp.companyName}</span>
              )}
              {exp.tradeArea && <span>{exp.tradeArea}</span>}
              {(exp.signOnDate || exp.signOffDate) && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="size-3" />
                  {fmtDate(exp.signOnDate)} — {fmtDate(exp.signOffDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t('common.edit')}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label={t('common.delete')}
            className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {(exp.captainName || exp.chiefEngName) && (
        <div className="mt-3 pt-3 border-t grid sm:grid-cols-2 gap-2">
          {exp.captainName && (
            <SupervisorLine icon={<UserIcon className="size-3.5" />} name={exp.captainName} contact={exp.captainContact} role={t('cv.captainName')} />
          )}
          {exp.chiefEngName && (
            <SupervisorLine icon={<AnchorIcon className="size-3.5" />} name={exp.chiefEngName} contact={exp.chiefEngContact} role={t('cv.chiefEngName')} />
          )}
        </div>
      )}
    </li>
  )
}

function SupervisorLine({
  icon, name, contact, role,
}: {
  icon: React.ReactNode
  name: string
  contact: string | null
  role: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground">{role}:</span>
      <span className="font-medium truncate">{name}</span>
      {contact && <span className="text-muted-foreground truncate">· {contact}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

function CertificatesTab({ profile }: { profile: SeafarerWithRelations }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Certificate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const certificates = profile.certificates

  const delMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/seafarers/me/certificates/${id}?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('common.success'))
      setDeleteId(null)
    },
    onError: () => toast.error(t('common.error')),
  })

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (c: Certificate) => { setEditing(c); setDialogOpen(true) }

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        icon={<Award className="size-4" />}
        title={t('cv.certificates')}
        hint={t('cv.certificatesHint')}
        action={
          <Button onClick={openAdd} size="sm">
            <Plus className="size-4" /> {t('cv.addCertificate')}
          </Button>
        }
      />

      <div className="mt-4 text-sm text-muted-foreground">
        {t('cv.certificatesCount', { count: certificates.length })}
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="size-8" />}
          title={t('cv.noCertificates')}
          action={
            <Button onClick={openAdd} variant="outline" size="sm">
              <Plus className="size-4" /> {t('cv.addCertificate')}
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {certificates.map((c) => (
            <CertificateCard key={c.id} cert={c} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
          ))}
        </ul>
      )}

      <CertificateDialog open={dialogOpen} onOpenChange={setDialogOpen} certificate={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cv.deleteCertificateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cv.deleteCertificateDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMutation.mutate(deleteId)}
              disabled={delMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {delMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function CertificateCard({
  cert, onEdit, onDelete,
}: {
  cert: Certificate
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : null)

  const expired = cert.expiryDate ? new Date(cert.expiryDate) < new Date() : false

  return (
    <li className="rounded-lg border p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="size-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold leading-tight truncate">{cert.name}</h4>
            {cert.number && <p className="text-xs text-muted-foreground mt-0.5">{cert.number}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t('common.edit')}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label={t('common.delete')}
            className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {cert.issuingAuthority && <span>{cert.issuingAuthority}</span>}
        {fmtDate(cert.issuedDate) && <span>· {t('cv.issuedDate')}: {fmtDate(cert.issuedDate)}</span>}
      </div>

      {fmtDate(cert.expiryDate) && (
        <Badge variant="outline" className={expired ? 'border-destructive/30 bg-destructive/10 text-destructive w-fit' : 'w-fit'}>
          {t('cv.expiryDate')}: {fmtDate(cert.expiryDate)}
        </Badge>
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Documents & visas                                                   */
/* ------------------------------------------------------------------ */

interface DocumentsForm {
  passportNo: string
  passportExpiry: string
  usVisa: string
  schengenVisa: string
}

function DocumentsTab({ profile }: { profile: SeafarerWithRelations }) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const [form, setForm] = useState<DocumentsForm>(() => ({
    passportNo: profile.passportNo || '',
    passportExpiry: profile.passportExpiry || '',
    usVisa: profile.usVisa || '',
    schengenVisa: profile.schengenVisa || '',
  }))
  const [lastProfile, setLastProfile] = useState(profile)
  if (profile !== lastProfile) {
    setLastProfile(profile)
    setForm({
      passportNo: profile.passportNo || '',
      passportExpiry: profile.passportExpiry || '',
      usVisa: profile.usVisa || '',
      schengenVisa: profile.schengenVisa || '',
    })
  }

  const mutation = useMutation({
    mutationFn: (body: Partial<DocumentsForm>) => api.put('/api/seafarers/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('cv.savedSuccess'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const set = <K extends keyof DocumentsForm>(k: K, v: DocumentsForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        icon={<FileText className="size-4" />}
        title={t('cv.documents')}
        hint={t('cv.documentsHint')}
      />

      <form
        className="space-y-5 mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(form)
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('cv.passportNo')}>
            <Input value={form.passportNo} onChange={(e) => set('passportNo', e.target.value)} />
          </Field>
          <Field label={t('cv.passportExpiry')}>
            <Input type="date" value={form.passportExpiry} onChange={(e) => set('passportExpiry', e.target.value)} />
          </Field>
          <Field label={t('cv.usVisa')}>
            <Input value={form.usVisa} onChange={(e) => set('usVisa', e.target.value)}
              placeholder="e.g. Valid C1/D until 2027" />
          </Field>
          <Field label={t('cv.schengenVisa')}>
            <Input value={form.schengenVisa} onChange={(e) => set('schengenVisa', e.target.value)}
              placeholder="e.g. Valid until 2026" />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon, title, hint, action,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {hint && <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function Field({
  label, required, children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="h-9 px-3 flex items-center rounded-md border bg-muted/30 text-sm">{value}</div>
    </div>
  )
}

function EmptyState({
  icon, title, action,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center text-center py-10 px-4 rounded-lg border border-dashed">
      <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
