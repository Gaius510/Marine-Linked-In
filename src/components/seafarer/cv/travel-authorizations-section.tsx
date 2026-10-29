'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusPill, type StatusTone } from '@/components/shared/status-pill'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteTravelAuthorization } from '@/components/seafarer/use-seafarer-profile'
import { TravelAuthorizationDialog } from './travel-authorization-dialog'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import {
  deriveTravelAuthorizationExpiryStatus,
  TRAVEL_AUTHORIZATION_EXPIRING_SOON_DAYS,
} from '@/lib/travel-authorizations'
import type { TravelAuthorization } from '@/lib/types'
import { Edit, Plus, ShieldCheck, Trash2 } from 'lucide-react'

export function TravelAuthorizationsSection({
  travelAuthorizations,
}: {
  travelAuthorizations?: TravelAuthorization[]
}) {
  const { t } = useI18n()
  const authorizations = travelAuthorizations ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TravelAuthorization | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TravelAuthorization | null>(null)
  const deleteMutation = useDeleteTravelAuthorization()

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (authorization: TravelAuthorization) => {
    setEditing(authorization)
    setDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget || deleteMutation.isPending) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t('cv.travelAuthDeleted'))
        setDeleteTarget(null)
      },
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">{t('cv.travelAuthorizations')}</h3>
          <p className="text-sm text-muted-foreground">{t('cv.travelAuthorizationsHint')}</p>
        </div>
        <Button type="button" onClick={openCreate} className="sm:self-start">
          <Plus className="size-4" />
          {t('cv.addTravelAuth')}
        </Button>
      </div>

      {authorizations.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('cv.noTravelAuthorizations')}
          description={t('cv.noTravelAuthorizationsDesc', { days: TRAVEL_AUTHORIZATION_EXPIRING_SOON_DAYS })}
          action={
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              {t('cv.addTravelAuth')}
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {authorizations.map((authorization) => (
            <TravelAuthorizationCard
              key={authorization.id}
              authorization={authorization}
              onEdit={() => openEdit(authorization)}
              onDelete={() => setDeleteTarget(authorization)}
            />
          ))}
        </div>
      )}

      <TravelAuthorizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        authorization={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cv.deleteTravelAuthTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t('cv.deleteTravelAuthDesc', { name: authorizationName(deleteTarget, t) })
                : t('cv.deleteTravelAuthDesc', { name: t('cv.travelAuthorization') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('cv.travelAuthDeleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TravelAuthorizationCard({
  authorization,
  onEdit,
  onDelete,
}: {
  authorization: TravelAuthorization
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const validity = deriveTravelAuthorizationExpiryStatus(authorization.expiresAt)
  const validityTone: Record<typeof validity, StatusTone> = {
    VALID: 'success',
    EXPIRING_SOON: 'warning',
    EXPIRED: 'danger',
    NO_EXPIRY: 'neutral',
  }
  const verificationTone: Record<TravelAuthorization['verificationStatus'], StatusTone> = {
    UNVERIFIED: 'neutral',
    VERIFIED: 'success',
    REJECTED: 'danger',
  }

  return (
    <article className="py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words text-sm font-semibold">{authorizationName(authorization, t)}</h4>
            <StatusPill tone={validityTone[validity]}>{t(`travelAuth.validity.${validity}`)}</StatusPill>
            <StatusPill tone={verificationTone[authorization.verificationStatus]}>
              {t(`travelAuth.verification.${authorization.verificationStatus}`)}
            </StatusPill>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <Info label={t('cv.travelAuthCountry')} value={safeText(authorization.countryCode, t('common.notProvided'))} />
            <Info label={t('cv.travelAuthIssuedAt')} value={formatDate(authorization.issuedAt, t('common.notProvided'))} />
            <Info label={t('cv.travelAuthExpiresAt')} value={formatDate(authorization.expiresAt, t('common.notProvided'))} />
            <Info label={t('cv.travelAuthDocumentNumber')} value={safeText(authorization.documentNumber, t('common.notProvided'))} />
          </div>
          {authorization.notes && (
            <p className="break-words border-s-2 border-border px-2 text-sm text-muted-foreground">
              {authorization.notes}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2 sm:justify-end">
          <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={t('cv.editTravelAuth')} title={t('common.edit')}>
            <Edit className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label={t('cv.deleteTravelAuthTitle')} title={t('common.delete')} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-foreground">{value}</div>
    </div>
  )
}

function authorizationName(authorization: TravelAuthorization, t: (key: string, vars?: Record<string, string | number>) => string) {
  return authorization.type === 'OTHER'
    ? safeText(authorization.customType, t('travelAuth.type.OTHER'))
    : t(`travelAuth.type.${authorization.type}`)
}
