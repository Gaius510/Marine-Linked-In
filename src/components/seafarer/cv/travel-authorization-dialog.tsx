'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { toast } from 'sonner'
import { FieldError } from '@/components/shared/field-error'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateTravelAuthorization,
  useUpdateTravelAuthorization,
} from '@/components/seafarer/use-seafarer-profile'
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { useI18n } from '@/lib/i18n'
import type { TravelAuthorization, TravelAuthorizationType } from '@/lib/types'
import {
  travelAuthorizationCreateSchema,
  travelAuthorizationUpdateSchema,
} from '@/lib/validation/travel-authorizations'
import { Loader2, ShieldCheck } from 'lucide-react'

const AUTHORIZATION_TYPES: TravelAuthorizationType[] = [
  'US_C1_D',
  'SCHENGEN',
  'UK_TRANSIT_OR_SEAFARER',
  'AU_MARITIME_CREW',
  'OTHER',
]

interface FormState {
  type: TravelAuthorizationType
  customType: string
  countryCode: string
  documentNumber: string
  issuedAt: string
  expiresAt: string
  notes: string
}

const emptyForm: FormState = {
  type: 'US_C1_D',
  customType: '',
  countryCode: '',
  documentNumber: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
}

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toForm(authorization?: TravelAuthorization | null): FormState {
  if (!authorization) return emptyForm
  return {
    type: authorization.type,
    customType: authorization.customType || '',
    countryCode: authorization.countryCode || '',
    documentNumber: authorization.documentNumber || '',
    issuedAt: toDateInput(authorization.issuedAt),
    expiresAt: toDateInput(authorization.expiresAt),
    notes: authorization.notes || '',
  }
}

export function TravelAuthorizationDialog({
  open,
  onOpenChange,
  authorization,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  authorization?: TravelAuthorization | null
}) {
  const { t } = useI18n()
  const isEdit = !!authorization
  const createMutation = useCreateTravelAuthorization()
  const updateMutation = useUpdateTravelAuthorization()
  const isPending = createMutation.isPending || updateMutation.isPending
  const [form, setForm] = useState<FormState>(() => toForm(authorization))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const sessionKey = `${open ? 'open' : 'closed'}_${authorization?.id ?? 'new'}`
  const [lastSession, setLastSession] = useState(sessionKey)

  if (sessionKey !== lastSession) {
    setLastSession(sessionKey)
    if (open) {
      setForm(toForm(authorization))
      setFieldErrors({})
    }
  }

  const fieldIds: Record<string, string> = {
    type: 'travel-auth-type',
    customType: 'travel-auth-custom-type',
    countryCode: 'travel-auth-country-code',
    documentNumber: 'travel-auth-document-number',
    issuedAt: 'travel-auth-issued-at',
    expiresAt: 'travel-auth-expires-at',
    notes: 'travel-auth-notes',
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  const payload = {
    type: form.type,
    customType: form.type === 'OTHER' ? form.customType : undefined,
    countryCode: form.countryCode || undefined,
    documentNumber: form.documentNumber || undefined,
    issuedAt: form.issuedAt || undefined,
    expiresAt: form.expiresAt || undefined,
    notes: form.notes || undefined,
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (isPending) return
    setFieldErrors({})

    const options = {
      onSuccess: () => {
        toast.success(t(isEdit ? 'cv.travelAuthUpdated' : 'cv.travelAuthAdded'))
        onOpenChange(false)
      },
      onError: (error: Error) => {
        const fields = apiFieldErrors(error)
        if (fields) {
          setFieldErrors(fields)
          focusFirstInvalid(fields, fieldIds)
          return
        }
        toast.error(t('common.error'))
      },
    }

    if (isEdit && authorization) {
      const result = validateFields(travelAuthorizationUpdateSchema, payload)
      if (result.errors) {
        setFieldErrors(result.errors)
        focusFirstInvalid(result.errors, fieldIds)
        return
      }
      updateMutation.mutate({ id: authorization.id, body: result.data }, options)
    } else {
      const result = validateFields(travelAuthorizationCreateSchema, payload)
      if (result.errors) {
        setFieldErrors(result.errors)
        focusFirstInvalid(result.errors, fieldIds)
        return
      }
      createMutation.mutate(result.data, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {isEdit ? t('cv.editTravelAuth') : t('cv.addTravelAuth')}
          </DialogTitle>
          <DialogDescription>{t('cv.travelAuthDialogDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="travel-auth-type" label={t('cv.travelAuthType')} error={fieldErrors.type} required>
              <Select value={form.type} onValueChange={(value) => set('type', value as TravelAuthorizationType)}>
                <SelectTrigger
                  id="travel-auth-type"
                  className="w-full"
                  aria-invalid={!!fieldErrors.type}
                  aria-describedby={fieldErrors.type ? 'travel-auth-type-error' : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTHORIZATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`travelAuth.type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.type === 'OTHER' && (
              <Field id="travel-auth-custom-type" label={t('cv.travelAuthCustomType')} error={fieldErrors.customType} required>
                <Input
                  id="travel-auth-custom-type"
                  value={form.customType}
                  onChange={(event) => set('customType', event.target.value)}
                  aria-invalid={!!fieldErrors.customType}
                  aria-describedby={fieldErrors.customType ? 'travel-auth-custom-type-error' : undefined}
                />
              </Field>
            )}

            <Field id="travel-auth-country-code" label={t('cv.travelAuthCountry')} error={fieldErrors.countryCode} helper={t('cv.travelAuthCountryHelp')}>
              <Input
                id="travel-auth-country-code"
                value={form.countryCode}
                onChange={(event) => set('countryCode', event.target.value.toUpperCase())}
                placeholder="GB"
                maxLength={2}
                aria-invalid={!!fieldErrors.countryCode}
                aria-describedby={fieldErrors.countryCode ? 'travel-auth-country-code-error' : 'travel-auth-country-code-help'}
              />
            </Field>

            <Field id="travel-auth-document-number" label={t('cv.travelAuthDocumentNumber')} error={fieldErrors.documentNumber}>
              <Input
                id="travel-auth-document-number"
                value={form.documentNumber}
                onChange={(event) => set('documentNumber', event.target.value)}
                aria-invalid={!!fieldErrors.documentNumber}
                aria-describedby={fieldErrors.documentNumber ? 'travel-auth-document-number-error' : undefined}
              />
            </Field>

            <Field id="travel-auth-issued-at" label={t('cv.travelAuthIssuedAt')} error={fieldErrors.issuedAt}>
              <Input
                id="travel-auth-issued-at"
                type="date"
                value={form.issuedAt}
                onChange={(event) => set('issuedAt', event.target.value)}
                aria-invalid={!!fieldErrors.issuedAt}
                aria-describedby={fieldErrors.issuedAt ? 'travel-auth-issued-at-error' : undefined}
              />
            </Field>

            <Field id="travel-auth-expires-at" label={t('cv.travelAuthExpiresAt')} error={fieldErrors.expiresAt}>
              <Input
                id="travel-auth-expires-at"
                type="date"
                value={form.expiresAt}
                onChange={(event) => set('expiresAt', event.target.value)}
                aria-invalid={!!fieldErrors.expiresAt}
                aria-describedby={fieldErrors.expiresAt ? 'travel-auth-expires-at-error' : undefined}
              />
            </Field>
          </div>

          <Field id="travel-auth-notes" label={t('cv.travelAuthNotes')} error={fieldErrors.notes}>
            <Textarea
              id="travel-auth-notes"
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
              rows={4}
              aria-invalid={!!fieldErrors.notes}
              aria-describedby={fieldErrors.notes ? 'travel-auth-notes-error' : undefined}
            />
          </Field>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending
                ? t(isEdit ? 'cv.travelAuthUpdating' : 'cv.travelAuthAdding')
                : t(isEdit ? 'common.update' : 'common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  helper,
  error,
  required,
  children,
}: {
  id: string
  label: string
  helper?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ms-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {helper && !error && <p id={`${id}-help`} className="text-xs text-muted-foreground">{helper}</p>}
      <FieldError id={`${id}-error`} code={error} t={t} />
    </div>
  )
}
