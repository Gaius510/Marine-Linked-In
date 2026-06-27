import { translateFieldError, type Translate } from '@/lib/form-validation'

export function FieldError({
  id,
  code,
  t,
}: {
  id: string
  code?: string
  t: Translate
}) {
  return (
    <p id={id} className="min-h-4 text-xs font-medium text-destructive">
      {code ? translateFieldError(t, code) : null}
    </p>
  )
}
