'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { ExperienceDialog } from '@/components/seafarer/experience-dialog'
import { useDeleteVesselExperience } from '@/components/seafarer/use-seafarer-profile'
import { formatDate, formatDurationBetween, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { VesselExperience } from '@/lib/types'
import type { SeafarerCvProfile } from './types'
import {
  Loader2,
  Pencil,
  Plus,
  Ship,
  Trash2,
} from 'lucide-react'

export function VesselExperienceSection({
  profile,
  complete,
}: {
  profile: SeafarerCvProfile
  complete: boolean
}) {
  const { t } = useI18n()
  const deleteMutation = useDeleteVesselExperience()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VesselExperience | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const experiences = profile.vesselExperiences
  const deleteTarget = experiences.find((experience) => experience.id === deleteId)

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (experience: VesselExperience) => {
    setEditing(experience)
    setDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteId || deleteMutation.isPending) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success(t('cv.experienceDeleted'))
        setDeleteId(null)
      },
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <Ship className="size-4 text-primary" />
          {t('cv.vesselExperience')}
        </span>
      }
      subtitle={t('cv.experienceHint')}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusPill tone={complete ? 'success' : 'warning'}>{complete ? t('cv.complete') : t('cv.incomplete')}</StatusPill>
          <Button onClick={openAdd} size="sm">
            <Plus className="size-4" />
            {t('cv.addExperience')}
          </Button>
        </div>
      }
    >
      <div className="mb-4 border-s-2 border-primary bg-secondary/45 px-3 py-2 text-sm">
        <p className="font-medium">{t('cv.selectMultipleVessels')}</p>
        <p className="mt-1 text-muted-foreground">{t('cv.experienceHint')}</p>
      </div>

      <div className="mb-3 text-sm text-muted-foreground">
        {t('cv.experienceCount', { count: experiences.length })}
      </div>

      {experiences.length === 0 ? (
        <EmptyState
          icon={Ship}
          title={t('cv.noExperience')}
          framed={false}
          action={
            <Button onClick={openAdd} variant="outline" size="sm">
              <Plus className="size-4" />
              {t('cv.addExperience')}
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              onEdit={() => openEdit(experience)}
              onDelete={() => setDeleteId(experience.id)}
            />
          ))}
        </ul>
      )}

      <ExperienceDialog open={dialogOpen} onOpenChange={setDialogOpen} experience={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cv.deleteExperienceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cv.deleteExperienceDesc')}
              {deleteTarget && (
                <span className="mt-2 block font-medium text-foreground">
                  {safeText(deleteTarget.vesselName || deleteTarget.vesselType)}
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

function ExperienceCard({
  experience,
  onEdit,
  onDelete,
}: {
  experience: VesselExperience
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const title = safeText(experience.vesselName || experience.vesselType, t('common.notProvided'))
  const duration = formatDurationBetween(experience.signOnDate, experience.signOffDate, '')

  return (
    <li className="py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 font-semibold">{title}</h3>
              <span className="text-xs text-muted-foreground">{experience.vesselType}</span>
              {experience.rank && <span className="text-xs text-muted-foreground">· {experience.rank}</span>}
            </div>
            <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span className="truncate">{safeText(experience.companyName, t('common.notProvided'))}</span>
              <span className="truncate">{safeText(experience.tradeArea, t('common.notProvided'))}</span>
              <span>{formatDate(experience.signOnDate, t('common.notProvided'))} - {formatDate(experience.signOffDate, t('common.notProvided'))}</span>
              <span>{duration ? `${t('cv.duration')}: ${duration}` : t('common.notProvided')}</span>
            </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
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

      {(experience.captainName || experience.chiefEngName) && (
        <div className="mt-4 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2">
          {experience.captainName && (
            <SupervisorLine
              role={t('cv.captainName')}
              name={experience.captainName}
              contact={experience.captainContact}
            />
          )}
          {experience.chiefEngName && (
            <SupervisorLine
              role={t('cv.chiefEngName')}
              name={experience.chiefEngName}
              contact={experience.chiefEngContact}
            />
          )}
        </div>
      )}
    </li>
  )
}

function SupervisorLine({
  role,
  name,
  contact,
}: {
  role: string
  name: string
  contact: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <span className="text-muted-foreground">{role}:</span>
      <span className="truncate font-medium">{name}</span>
      {contact && <span className="truncate text-muted-foreground">· {contact}</span>}
    </div>
  )
}
