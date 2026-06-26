import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function CvFormField({
  id,
  label,
  required,
  helper,
  children,
}: {
  id?: string
  label: string
  required?: boolean
  helper?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ms-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  )
}

export function CvReadOnlyField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex min-h-9 items-center rounded-md border bg-muted/30 px-3 py-2 text-sm break-words">
        {value}
      </div>
    </div>
  )
}
