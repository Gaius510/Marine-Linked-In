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
  if (!code) return null

  return (
    <p id={id} className="text-xs text-destructive">
      {translateFieldError(t, code)}
    </p>
  )
}
