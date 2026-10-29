import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type MetricTone = 'primary' | 'emerald' | 'amber' | 'violet'

const toneClasses: Record<MetricTone, string> = {
  primary: 'text-primary',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
  violet: 'text-violet-700 dark:text-violet-400',
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  className,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: MetricTone
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('min-w-0 border-t border-border pt-3', className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className={cn('size-3.5 shrink-0', toneClasses[tone])} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}
