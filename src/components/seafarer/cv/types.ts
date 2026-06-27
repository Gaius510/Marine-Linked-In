import type { Application, SeafarerWithRelations, TravelAuthorization } from '@/lib/types'

export type SeafarerCvProfile = SeafarerWithRelations & {
  applications: Application[]
  travelAuthorizations?: TravelAuthorization[]
}

export interface CompletionItem {
  key: string
  label: string
  complete: boolean
}
