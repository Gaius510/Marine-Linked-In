'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { JobCard } from '@/components/shared/job-card'
import { Card } from '@/components/ui/card'
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
import { PlusCircle, Briefcase, Users, Trash2, Eye, DoorOpen, DoorClosed } from 'lucide-react'

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'OPEN' | 'CLOSED' }) =>
      api.put(`/api/jobs/${id}?id=${id}`, { status }),
    onSuccess: () => {
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
    <div>
      <PageHeader
        title={t('recruiter.myJobPostings')}
        action={
          <Button onClick={() => setView('postJob')} className="h-10">
            <PlusCircle className="size-4" />
            {t('common.postJob')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Briefcase className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('recruiter.noJobs')}</p>
          <Button onClick={() => setView('postJob')} className="mx-auto">
            <PlusCircle className="size-4" />
            {t('common.postJob')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const isOpen = job.status === 'OPEN'
            const applicantsCount = job._count?.applications ?? 0
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
                    >
                      {isOpen ? <DoorClosed className="size-4" /> : <DoorOpen className="size-4" />}
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

      {/* Empty applicants hint when no applicants dialog open */}
      {!applicantsJob && jobs.length > 0 && (
        <div className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="size-3.5" />
          {t('jobs.applicants')} — {t('jobs.viewApplicants')}
        </div>
      )}
    </div>
  )
}
