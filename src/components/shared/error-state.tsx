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
    <Card className="p-8 text-center sm:p-12">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/15">
        <AlertTriangle className="size-6" />
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
