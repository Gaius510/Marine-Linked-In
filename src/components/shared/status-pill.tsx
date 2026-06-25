import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-secondary text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
}

export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('shrink-0', toneClasses[tone], className)}>
      {children}
    </Badge>
  )
}
