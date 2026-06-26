import type { StatusTone } from '@/components/shared/status-pill'

export function getExpiryState(value: string | null | undefined): {
  tone: StatusTone
  key: 'cv.expired' | 'cv.expiringSoon' | 'cv.valid'
} | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { tone: 'danger', key: 'cv.expired' }
  if (days <= 180) return { tone: 'warning', key: 'cv.expiringSoon' }
  return { tone: 'success', key: 'cv.valid' }
}
