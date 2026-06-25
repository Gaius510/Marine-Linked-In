import { Card } from '@/components/ui/card'
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
    <div className={cn('text-center', framed ? 'p-8 sm:p-10' : 'py-8', className)}>
      {Icon && <Icon className="size-10 text-muted-foreground/40 mx-auto mb-3" />}
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )

  if (!framed) return content

  return <Card>{content}</Card>
}
