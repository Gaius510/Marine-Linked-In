'use client'

import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'primary' | 'emerald' | 'amber' | 'violet'
  hint?: string
}) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-muted-foreground truncate">{label}</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn('size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0', tones[tone])}>
          <Icon className="size-5 sm:size-6" />
        </div>
      </div>
    </Card>
  )
}
