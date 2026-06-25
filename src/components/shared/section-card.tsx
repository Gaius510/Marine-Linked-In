import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn('border-border/80 bg-card/95 p-4 sm:p-6', className)}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </Card>
  )
}
