'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useNavStore } from '@/stores/nav-store'
import type { Message } from '@/lib/types'
import { Mail, ChevronDown, ChevronUp, Inbox } from 'lucide-react'

export function MessagesView() {
  const { t, locale } = useI18n()
  const setView = useNavStore((s) => s.setView)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<{ messages: Message[] }>('/api/messages'),
  })

  const messages = data?.messages ?? []

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <PageHeader title={t('messages.title')} subtitle={t('messages.subtitle')} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Mail className="size-6" />
          </div>
          <p className="font-medium">{t('messages.empty')}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t('messages.emptyDesc')}</p>
          <Button onClick={() => setView('browse')} className="mx-auto">
            {t('common.browseSeafarers')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOpen = expanded.has(msg.id)
            const recipient = msg.seafarer?.user.name ?? '—'
            const initials = recipient.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
            const dt = new Date(msg.createdAt)
            return (
              <Card key={msg.id} className="p-4">
                <button
                  onClick={() => toggle(msg.id)}
                  className="flex items-start gap-3 w-full text-start"
                >
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{msg.subject || t('messages.subject')}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span>{dt.toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
                        {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{t('messages.to')}:</span>
                      <span className="font-medium text-foreground">{recipient}</span>
                      {msg.read && (
                        <Badge variant="secondary" className="text-[10px]">Read</Badge>
                      )}
                    </div>
                    {!isOpen && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                        {msg.body}
                      </p>
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-1">{t('messages.body')}</div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
