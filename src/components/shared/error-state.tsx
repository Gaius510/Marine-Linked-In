'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface ErrorStateProps {
  onRetry?: () => void
  message?: string
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useI18n()
  return (
    <Card className="border-destructive/20 bg-destructive/[0.025] p-8 text-center shadow-none sm:p-10">
      <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="mb-1 text-sm leading-6 text-muted-foreground">
        {message || t('common.error')}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
          <RefreshCw className="size-4 me-2" />
          {t('common.retry')}
        </Button>
      )}
    </Card>
  )
}
