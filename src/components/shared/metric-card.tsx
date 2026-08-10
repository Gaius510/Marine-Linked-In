import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type MetricTone = 'primary' | 'emerald' | 'amber' | 'violet'

const toneClasses: Record<MetricTone, string> = {
  primary: 'border-primary/25 bg-secondary text-primary',
  emerald: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400',
  amber: 'border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-400',
  violet: 'border-violet-500/20 bg-violet-500/8 text-violet-700 dark:text-violet-400',
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
    <Card className={cn('border-s-[3px] border-s-primary p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-md border', toneClasses[tone])}>
          <Icon className="size-4.5" />
        </div>
      </div>
    </Card>
  )
}
