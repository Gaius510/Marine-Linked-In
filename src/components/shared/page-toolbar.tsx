import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function PageToolbar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {children}
    </div>
  )
}
