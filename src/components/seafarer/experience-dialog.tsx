'use client'

import { useState } from 'react'
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
import { Ship, User, Loader2 } from 'lucide-react'

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vesselType) {
      toast.error(t('cv.vesselType'))
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="size-5 text-primary" />
            {isEdit ? t('cv.editExperience') : t('cv.addExperience')}
          </DialogTitle>
          <DialogDescription>{t('cv.selectMultipleVessels')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {/* Vessel / voyage details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('cv.rank')}>
              <Select value={form.rank} onValueChange={(v) => set('rank', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('cv.rank')} />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('cv.vesselType')} required>
              <Select value={form.vesselType} onValueChange={(v) => set('vesselType', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VESSEL_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('cv.vesselName')}>
              <Input value={form.vesselName} onChange={(e) => set('vesselName', e.target.value)} />
            </Field>
            <Field label={t('cv.companyName')}>
              <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            </Field>
            <Field label={t('cv.imoNumber')}>
              <Input value={form.imoNumber} onChange={(e) => set('imoNumber', e.target.value)} />
            </Field>
            <Field label={t('cv.grossTonnage')}>
              <Input value={form.grossTonnage} onChange={(e) => set('grossTonnage', e.target.value)} />
            </Field>
            <Field label={t('cv.engineType')}>
              <Input value={form.engineType} onChange={(e) => set('engineType', e.target.value)} />
            </Field>
            <Field label={t('cv.tradeArea')}>
              <Input value={form.tradeArea} onChange={(e) => set('tradeArea', e.target.value)} />
            </Field>
            <Field label={t('cv.signOnDate')}>
              <Input type="date" value={form.signOnDate} onChange={(e) => set('signOnDate', e.target.value)} />
            </Field>
            <Field label={t('cv.signOffDate')}>
              <Input type="date" value={form.signOffDate} onChange={(e) => set('signOffDate', e.target.value)} />
            </Field>
          </div>

          <Separator />

          {/* Supervisor contacts sub-section (verification feature) */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{t('cv.supervisorContacts')}</h4>
                <p className="text-xs text-muted-foreground">{t('cv.supervisorHint')}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <Field label={t('cv.captainName')}>
                <Input value={form.captainName} onChange={(e) => set('captainName', e.target.value)} />
              </Field>
              <Field label={t('cv.captainContact')}>
                <Input value={form.captainContact} onChange={(e) => set('captainContact', e.target.value)} placeholder="+1 234 567 8900" />
              </Field>
              <Field label={t('cv.chiefEngName')}>
                <Input value={form.chiefEngName} onChange={(e) => set('chiefEngName', e.target.value)} />
              </Field>
              <Field label={t('cv.chiefEngContact')}>
                <Input value={form.chiefEngContact} onChange={(e) => set('chiefEngContact', e.target.value)} placeholder="+1 234 567 8900" />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
