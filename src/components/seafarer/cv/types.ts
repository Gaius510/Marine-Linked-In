import type { Application, SeafarerWithRelations } from '@/lib/types'

export type SeafarerCvProfile = SeafarerWithRelations & { applications: Application[] }

export interface CompletionItem {
  key: string
  label: string
  complete: boolean
}
