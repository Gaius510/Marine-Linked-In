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
    <div className={cn('text-center', framed ? 'p-7 sm:p-9' : 'py-7', className)}>
      {Icon && (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md border border-primary/20 bg-secondary text-primary">
          <Icon className="size-5" />
        </div>
      )}
      <p className="font-semibold tracking-tight">{title}</p>
      {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )

  if (!framed) return content

  return <Card className="border-dashed bg-card/60 shadow-none">{content}</Card>
}
