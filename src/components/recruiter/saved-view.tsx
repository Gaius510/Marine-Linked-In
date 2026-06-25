'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SeafarerCard } from '@/components/shared/seafarer-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageDialog } from './message-dialog'
import { ScheduleInterviewDialog } from './schedule-interview-dialog'
import { SeafarerDetailDialog } from './seafarer-detail-dialog'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import { toast } from 'sonner'
import type { SeafarerWithRelations, SavedProfile } from '@/lib/types'
import { Bookmark, Mail, Users, Trash2 } from 'lucide-react'

export function SavedView() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const setView = useNavStore((s) => s.setView)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ id: string; name: string } | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<{ saved: (SavedProfile & { seafarer: SeafarerWithRelations })[] }>('/api/saved'),
  })

  const saved = data?.saved ?? []

  const unsaveMutation = useMutation({
    mutationFn: (seafarerId: string) => api.del(`/api/saved/${seafarerId}?seafarerId=${seafarerId}`),
    onSuccess: () => {
      toast.success(t('saved.unsavedSuccess'))
      qc.invalidateQueries({ queryKey: ['saved'] })
      qc.invalidateQueries({ queryKey: ['seafarers'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="space-y-4">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('saved.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('saved.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => setView('browse')}>
          {t('saved.browseCta')}
        </Button>
      </PageToolbar>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t('saved.empty')}
          description={t('saved.emptyDesc')}
          action={<Button onClick={() => setView('browse')}>{t('saved.browseCta')}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((item) => {
            const sf = item.seafarer
            return (
              <SeafarerCard
                key={item.id}
                seafarer={sf}
                onClick={() => setDetailId(sf.id)}
                showSaved
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setMessageTarget({ id: sf.id, name: sf.user.name })}
                    >
                      <Mail className="size-4" />
                      {t('browse.message')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setScheduleTarget({ id: sf.id, name: sf.user.name })}
                    >
                      <Users className="size-4" />
                      {t('browse.schedule')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => unsaveMutation.mutate(sf.id)}
                      disabled={unsaveMutation.isPending}
                      aria-label={t('browse.unsave')}
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

      {/* Dialogs */}
      <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
      <MessageDialog
        open={!!messageTarget}
        onOpenChange={(o) => !o && setMessageTarget(null)}
        seafarerId={messageTarget?.id}
        recipientName={messageTarget?.name}
      />
      <ScheduleInterviewDialog
        open={!!scheduleTarget}
        onOpenChange={(o) => !o && setScheduleTarget(null)}
        seafarerId={scheduleTarget?.id ?? null}
        seafarerName={scheduleTarget?.name}
      />
    </div>
  )
}
