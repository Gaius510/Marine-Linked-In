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
    <Card className="p-8 sm:p-12 text-center">
      <div className="mx-auto size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground mb-1">
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
