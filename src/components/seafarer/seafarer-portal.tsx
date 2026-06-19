'use client'

import { useNavStore } from '@/stores/nav-store'
import { SeafarerOverview } from '@/components/seafarer/seafarer-overview'
import { SeafarerCV } from '@/components/seafarer/seafarer-cv'
import { SeafarerJobs } from '@/components/seafarer/seafarer-jobs'
import { SeafarerApplications } from '@/components/seafarer/seafarer-applications'

/**
 * Seafarer portal — switches between the four primary views driven by the
 * shared nav store (`overview` | `cv` | `jobs` | `applications`). The app
 * shell provides the header, sidebar, and sticky footer.
 */
export function SeafarerPortal() {
  const { view } = useNavStore()

  switch (view) {
    case 'cv':
      return <SeafarerCV />
    case 'jobs':
      return <SeafarerJobs />
    case 'applications':
      return <SeafarerApplications />
    case 'overview':
    default:
      return <SeafarerOverview />
  }
}
