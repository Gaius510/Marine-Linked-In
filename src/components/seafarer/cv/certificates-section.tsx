'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { CertificateDialog } from '@/components/seafarer/certificate-dialog'
import { useDeleteCertificate } from '@/components/seafarer/use-seafarer-profile'
import { EmptyState } from '@/components/shared/empty-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { Certificate } from '@/lib/types'
import { getExpiryState } from './cv-status'
import type { SeafarerCvProfile } from './types'
import { Award, Building2, CalendarClock, Hash, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

export function CertificatesSection({
  profile,
  complete,
}: {
  profile: SeafarerCvProfile
  complete: boolean
}) {
  const { t } = useI18n()
  const deleteMutation = useDeleteCertificate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Certificate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const certificates = profile.certificates
  const deleteTarget = certificates.find((certificate) => certificate.id === deleteId)

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (certificate: Certificate) => {
    setEditing(certificate)
    setDialogOpen(true)
  }
  const confirmDelete = () => {
    if (!deleteId || deleteMutation.isPending) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success(t('common.success'))
        setDeleteId(null)
      },
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <Award className="size-4 text-primary" />
          {t('cv.certificates')}
        </span>
      }
      subtitle={t('cv.certificatesHint')}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusPill tone={complete ? 'success' : 'warning'}>{complete ? t('cv.complete') : t('cv.incomplete')}</StatusPill>
          <Button onClick={openAdd} size="sm">
            <Plus className="size-4" />
            {t('cv.addCertificate')}
          </Button>
        </div>
      }
    >
      <div className="mb-3 text-sm text-muted-foreground">
        {t('cv.certificatesCount', { count: certificates.length })}
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('cv.noCertificates')}
          framed={false}
          action={
            <Button onClick={openAdd} variant="outline" size="sm">
              <Plus className="size-4" />
              {t('cv.addCertificate')}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onEdit={() => openEdit(certificate)}
              onDelete={() => setDeleteId(certificate.id)}
            />
          ))}
        </ul>
      )}

      <CertificateDialog open={dialogOpen} onOpenChange={setDialogOpen} certificate={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cv.deleteCertificateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cv.deleteCertificateDesc')}
              {deleteTarget && (
                <span className="mt-2 block font-medium text-foreground">
                  {deleteTarget.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

function CertificateCard({
  certificate,
  onEdit,
  onDelete,
}: {
  certificate: Certificate
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const expiryState = getExpiryState(certificate.expiryDate)

  return (
    <li className="rounded-lg border border-border/80 bg-background/60 p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Award className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold">{certificate.name}</h3>
            <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
              <MetaLine icon={<Building2 className="size-3.5" />} value={safeText(certificate.issuingAuthority, t('common.notProvided'))} />
              <MetaLine icon={<Hash className="size-3.5" />} value={safeText(certificate.number, t('common.notProvided'))} />
              <MetaLine icon={<CalendarClock className="size-3.5" />} value={`${t('cv.issuedDate')}: ${formatDate(certificate.issuedDate, t('common.notProvided'))}`} />
              <MetaLine icon={<CalendarClock className="size-3.5" />} value={`${t('cv.expiryDate')}: ${formatDate(certificate.expiryDate, t('common.notProvided'))}`} />
            </div>
            {expiryState && (
              <StatusPill tone={expiryState.tone} className="mt-3 w-fit">
                {t(expiryState.key)}
              </StatusPill>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t('common.edit')}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            aria-label={t('common.delete')}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  )
}

function MetaLine({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate">{value}</span>
    </span>
  )
}
