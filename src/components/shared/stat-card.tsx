import { MetricCard } from './metric-card'
import type { LucideIcon } from 'lucide-react'

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
  return <MetricCard label={label} value={value} icon={Icon} tone={tone} hint={hint} />
}
