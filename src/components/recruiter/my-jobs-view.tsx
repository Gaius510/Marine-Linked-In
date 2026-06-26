'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { JobCard } from '@/components/shared/job-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { StatusPill } from '@/components/shared/status-pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApplicantsDialog } from './applicants-dialog'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import { toast } from 'sonner'
import type { Job } from '@/lib/types'
import { PlusCircle, Briefcase, Trash2, Eye, DoorOpen, DoorClosed } from 'lucide-react'

export function MyJobsView({ onViewProfile }: { onViewProfile: (seafarerId: string) => void }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const setView = useNavStore((s) => s.setView)

  const [applicantsJob, setApplicantsJob] = useState<{ id: string; title: string } | null>(null)
  const [deleteJob, setDeleteJob] = useState<Job | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'mine'],
    queryFn: () => api.get<{ jobs: Job[] }>('/api/jobs?mine=1'),
  })

  const jobs = data?.jobs ?? []
  const openJobs = jobs.filter((job) => job.status === 'OPEN').length
  const closedJobs = jobs.length - openJobs

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'OPEN' | 'CLOSED' }) =>
      api.put(`/api/jobs/${id}?id=${id}`, { status }),
    onSuccess: () => {
      toast.success(t('jobs.statusUpdated'))
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/jobs/${id}?id=${id}`),
    onSuccess: () => {
      toast.success(t('common.success'))
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setDeleteJob(null)
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="space-y-4">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t('recruiter.myJobPostings')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? t('common.loading') : t('jobs.managementSummary', { count: jobs.length })}
          </p>
          {!isLoading && jobs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="success">{t('jobs.openCount', { count: openJobs })}</StatusPill>
              <StatusPill tone="neutral">{t('jobs.closedCount', { count: closedJobs })}</StatusPill>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={() => setView('postJob')} className="h-10">
            <PlusCircle className="size-4" />
            {t('common.postJob')}
          </Button>
        </div>
      </PageToolbar>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t('recruiter.noJobs')}
          description={t('jobs.noJobsHelp')}
          action={
            <Button onClick={() => setView('postJob')}>
              <PlusCircle className="size-4" />
              {t('common.postJob')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const isOpen = job.status === 'OPEN'
            return (
              <JobCard
                key={job.id}
                job={job}
                showStatus
                showApplicants
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setApplicantsJob({ id: job.id, title: job.title })}
                    >
                      <Eye className="size-4" />
                      {t('jobs.viewApplicants')}
                    </Button>
                    <Button
                      variant={isOpen ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        statusMutation.mutate({ id: job.id, status: isOpen ? 'CLOSED' : 'OPEN' })
                      }
                      disabled={statusMutation.isPending}
                      aria-label={isOpen ? t('jobs.closeJob') : t('jobs.reopenJob')}
                      title={isOpen ? t('jobs.closeJobHelp') : t('jobs.reopenJobHelp')}
                    >
                      {isOpen ? <DoorClosed className="size-4" /> : <DoorOpen className="size-4" />}
                      <span className="hidden sm:inline">{isOpen ? t('jobs.closeJob') : t('jobs.reopenJob')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteJob(job)}
                      aria-label={t('jobs.deleteJob')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                }
              />
            )
          })}
        </div>
      )}

      {/* Applicants dialog */}
      <ApplicantsDialog
        job={applicantsJob}
        onOpenChange={(o) => !o && setApplicantsJob(null)}
        onViewProfile={(sid) => {
          setApplicantsJob(null)
          onViewProfile(sid)
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteJob} onOpenChange={(o) => !o && setDeleteJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jobs.deleteJob')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('jobs.deleteJobConfirm')}
              <span className="mt-2 block">{t('jobs.closeInsteadHelp')}</span>
              {deleteJob && (
                <span className="block mt-2 font-medium text-foreground">
                  “{deleteJob.title}”
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteJob && deleteMutation.mutate(deleteJob.id)}
              disabled={deleteMutation.isPending}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
