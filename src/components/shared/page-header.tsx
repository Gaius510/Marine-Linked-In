'use client'

import { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-6 flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-primary/10">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  )
}
