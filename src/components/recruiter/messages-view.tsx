'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { SectionCard } from '@/components/shared/section-card'
import { StatusPill } from '@/components/shared/status-pill'
import { api } from '@/lib/api'
import { formatDate, safeText } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { Message } from '@/lib/types'
import { Mail, ChevronDown, ChevronUp, Send, UserRound, Calendar, Eye } from 'lucide-react'

export function MessagesView({ onViewProfile }: { onViewProfile?: (seafarerId: string) => void }) {
  const { t } = useI18n()
  const setView = useNavStore((s) => s.setView)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<{ messages: Message[] }>('/api/messages'),
  })

  const messages = (data?.messages ?? []).slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <PageToolbar className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t('messages.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? t('common.loading') : t('messages.summary', { count: messages.length })}
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setView('browse')}>
          <UserRound className="size-4" />
          {t('common.browseSeafarers')}
        </Button>
      </PageToolbar>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={t('messages.empty')}
          description={t('messages.emptyDesc')}
          action={<Button onClick={() => setView('browse')}>{t('common.browseSeafarers')}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              expanded={expanded.has(message.id)}
              onToggle={() => toggle(message.id)}
              onViewProfile={onViewProfile}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MessageItem({
  message,
  expanded,
  onToggle,
  onViewProfile,
  t,
}: {
  message: Message
  expanded: boolean
  onToggle: () => void
  onViewProfile?: (seafarerId: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const recipient = message.seafarer?.user.name ?? '-'
  const initials = recipient.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const subject = safeText(message.subject, t('messages.noSubject'))
  const body = safeText(message.body, t('messages.noBody'))

  return (
    <SectionCard className="p-4" contentClassName="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Avatar className="size-11 shrink-0 rounded-xl">
          <AvatarFallback className="rounded-xl bg-secondary text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Send className="size-4 shrink-0 text-primary" />
                <h2 className="truncate text-sm font-semibold">{subject}</h2>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{t('messages.to')}:</span>
                <button
                  type="button"
                  onClick={() => onViewProfile?.(message.seafarerId)}
                  disabled={!onViewProfile}
                  className="cursor-pointer rounded-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
                >
                  {recipient}
                </button>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {t('messages.sentAt')} {formatDate(message.createdAt)}
                </span>
              </div>
            </div>
            <StatusPill tone={message.read ? 'success' : 'neutral'}>
              {message.read ? t('messages.read') : t('messages.sent')}
            </StatusPill>
          </div>

          <div className="mt-3 rounded-lg bg-muted/45 p-3">
            <p className={expanded ? 'whitespace-pre-wrap text-sm leading-6' : 'line-clamp-2 text-sm leading-6 text-muted-foreground'}>
              {body}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-stretch justify-end gap-2 border-t border-border/70 pt-3 [&>[data-slot=button]]:min-w-0 [&>[data-slot=button]]:flex-1 sm:[&>[data-slot=button]]:flex-none">
        {onViewProfile && (
          <Button type="button" size="sm" onClick={() => onViewProfile(message.seafarerId)}>
            <Eye className="size-4" />
            {t('common.viewProfile')}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? t('messages.collapseMessage') : t('messages.expandMessage')}
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {expanded ? t('messages.showLess') : t('messages.showMore')}
        </Button>
      </div>
    </SectionCard>
  )
}
