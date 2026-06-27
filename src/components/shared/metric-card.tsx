import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type MetricTone = 'primary' | 'emerald' | 'amber' | 'violet'

const toneClasses: Record<MetricTone, string> = {
  primary: 'bg-secondary text-primary ring-1 ring-primary/10',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
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
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-muted-foreground truncate">{label}</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn('size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0', toneClasses[tone])}>
          <Icon className="size-5 sm:size-6" />
        </div>
      </div>
    </Card>
  )
}
