'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import type { VesselExperience } from '@/lib/types'
import { VESSEL_TYPES, RANKS } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SectionCard } from '@/components/shared/section-card'
import { Loader2, Ship, User } from 'lucide-react'

interface ExperienceDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** when editing, the experience to pre-fill */
  experience?: VesselExperience | null
}

interface FormState {
  rank: string
  vesselType: string
  vesselName: string
  companyName: string
  imoNumber: string
  grossTonnage: string
  engineType: string
  tradeArea: string
  signOnDate: string
  signOffDate: string
  captainName: string
  captainContact: string
  chiefEngName: string
  chiefEngContact: string
}

const empty: FormState = {
  rank: '', vesselType: VESSEL_TYPES[0], vesselName: '', companyName: '',
  imoNumber: '', grossTonnage: '', engineType: '', tradeArea: '',
  signOnDate: '', signOffDate: '', captainName: '', captainContact: '',
  chiefEngName: '', chiefEngContact: '',
}

function toForm(e: VesselExperience): FormState {
  return {
    rank: e.rank || '',
    vesselType: e.vesselType || VESSEL_TYPES[0],
    vesselName: e.vesselName || '',
    companyName: e.companyName || '',
    imoNumber: e.imoNumber || '',
    grossTonnage: e.grossTonnage || '',
    engineType: e.engineType || '',
    tradeArea: e.tradeArea || '',
    signOnDate: e.signOnDate || '',
    signOffDate: e.signOffDate || '',
    captainName: e.captainName || '',
    captainContact: e.captainContact || '',
    chiefEngName: e.chiefEngName || '',
    chiefEngContact: e.chiefEngContact || '',
  }
}

export function ExperienceDialog({ open, onOpenChange, experience }: ExperienceDialogProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const isEdit = !!experience

  const [form, setForm] = useState<FormState>(() => experience ? toForm(experience) : empty)
  // Reset the form whenever the dialog opens or the target experience changes.
  // Using the render-phase check pattern (instead of useEffect) to avoid
  // cascading renders — see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const sessionKey = `${open ? 'open' : 'closed'}_${experience?.id ?? 'new'}`
  const [lastSession, setLastSession] = useState(sessionKey)
  if (sessionKey !== lastSession) {
    setLastSession(sessionKey)
    if (open) {
      setForm(experience ? toForm(experience) : empty)
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && experience) {
        return api.put<{ experience: VesselExperience }>(
          `/api/seafarers/me/experiences/${experience.id}?id=${experience.id}`,
          form
        )
      }
      return api.post<{ experience: VesselExperience }>('/api/seafarers/me/experiences', form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seafarer', 'me'] })
      toast.success(t('cv.savedSuccess'))
      onOpenChange(false)
    },
    onError: () => {
      toast.error(t('common.error'))
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (mutation.isPending) return
    if (!form.vesselType) {
      toast.error(t('cv.vesselType'))
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="size-5 text-primary" />
            {isEdit ? t('cv.editExperience') : t('cv.addExperience')}
          </DialogTitle>
          <DialogDescription>{t('cv.selectMultipleVessels')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                <Ship className="size-4 text-primary" />
                {t('cv.vesselService')}
              </span>
            }
            subtitle={t('cv.experienceHint')}
            className="p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="experience-rank" label={t('cv.rank')}>
                <Select value={form.rank} onValueChange={(v) => set('rank', v)}>
                  <SelectTrigger id="experience-rank" className="w-full">
                    <SelectValue placeholder={t('cv.rank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {RANKS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="experience-vessel-type" label={t('cv.vesselType')} required>
                <Select value={form.vesselType} onValueChange={(v) => set('vesselType', v)}>
                  <SelectTrigger id="experience-vessel-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_TYPES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="experience-vessel-name" label={t('cv.vesselName')}>
                <Input id="experience-vessel-name" value={form.vesselName} onChange={(e) => set('vesselName', e.target.value)} />
              </Field>
              <Field id="experience-company-name" label={t('cv.companyName')}>
                <Input id="experience-company-name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
              </Field>
              <Field id="experience-imo-number" label={t('cv.imoNumber')}>
                <Input id="experience-imo-number" value={form.imoNumber} onChange={(e) => set('imoNumber', e.target.value)} />
              </Field>
              <Field id="experience-gross-tonnage" label={t('cv.grossTonnage')}>
                <Input id="experience-gross-tonnage" value={form.grossTonnage} onChange={(e) => set('grossTonnage', e.target.value)} />
              </Field>
              <Field id="experience-engine-type" label={t('cv.engineType')}>
                <Input id="experience-engine-type" value={form.engineType} onChange={(e) => set('engineType', e.target.value)} />
              </Field>
              <Field id="experience-trade-area" label={t('cv.tradeArea')}>
                <Input id="experience-trade-area" value={form.tradeArea} onChange={(e) => set('tradeArea', e.target.value)} />
              </Field>
              <Field id="experience-sign-on-date" label={t('cv.signOnDate')}>
                <Input id="experience-sign-on-date" type="date" value={form.signOnDate} onChange={(e) => set('signOnDate', e.target.value)} />
              </Field>
              <Field id="experience-sign-off-date" label={t('cv.signOffDate')}>
                <Input id="experience-sign-off-date" type="date" value={form.signOffDate} onChange={(e) => set('signOffDate', e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <Separator />

          <div className="space-y-3 rounded-lg border border-primary/20 bg-secondary p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{t('cv.supervisorContacts')}</h4>
                <p className="text-xs text-muted-foreground">{t('cv.supervisorHint')}</p>
              </div>
            </div>

            <div className="grid gap-4 pt-1 sm:grid-cols-2">
              <Field id="experience-captain-name" label={t('cv.captainName')}>
                <Input id="experience-captain-name" value={form.captainName} onChange={(e) => set('captainName', e.target.value)} />
              </Field>
              <Field id="experience-captain-contact" label={t('cv.captainContact')}>
                <Input id="experience-captain-contact" value={form.captainContact} onChange={(e) => set('captainContact', e.target.value)} placeholder="+1 234 567 8900" />
              </Field>
              <Field id="experience-chief-engineer-name" label={t('cv.chiefEngName')}>
                <Input id="experience-chief-engineer-name" value={form.chiefEngName} onChange={(e) => set('chiefEngName', e.target.value)} />
              </Field>
              <Field id="experience-chief-engineer-contact" label={t('cv.chiefEngContact')}>
                <Input id="experience-chief-engineer-contact" value={form.chiefEngContact} onChange={(e) => set('chiefEngContact', e.target.value)} placeholder="+1 234 567 8900" />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending ? t('common.saving') : isEdit ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id, label, required, children,
}: {
  id?: string
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
