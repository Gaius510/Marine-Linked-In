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
      {Icon && (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-primary/10">
          <Icon className="size-6" />
        </div>
      )}
      <p className="font-semibold tracking-tight">{title}</p>
      {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )

  if (!framed) return content

  return <Card className="border-dashed">{content}</Card>
}
