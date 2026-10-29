import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  framed = true,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  framed?: boolean
}) {
  const content = (
    <div className={cn('text-start', framed ? 'border-y border-border py-5' : 'py-5', className)}>
      {Icon && (
        <Icon className="mb-2 size-4 text-muted-foreground" />
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-0.5 max-w-xl text-sm leading-5 text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )

  return content
}
