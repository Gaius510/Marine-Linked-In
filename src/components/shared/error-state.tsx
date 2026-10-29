'use client'

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
    <div className="border-y border-destructive/20 py-5 text-start">
      <AlertTriangle className="mb-2 size-4 text-destructive" />
      <p className="text-sm leading-5 text-muted-foreground">
        {message || t('common.error')}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
          <RefreshCw className="size-4 me-2" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
