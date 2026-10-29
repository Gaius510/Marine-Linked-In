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
    <section className={cn('min-w-0 max-w-full border-t border-border pt-4', className)}>
      {(title || subtitle || action) && (
        <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-medium leading-5 text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
        </div>
      )}
      <div className={cn('min-w-0 max-w-full', contentClassName)}>{children}</div>
    </section>
  )
}
