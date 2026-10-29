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
    <header className="mb-4 flex min-w-0 max-w-full flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-1 flex shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-medium leading-7 text-balance">{title}</h1>
          {subtitle && <p className="mt-0.5 max-w-3xl break-words text-sm leading-5 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </header>
  )
}
