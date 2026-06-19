'use client'

import { useNavStore } from '@/stores/nav-store'
import { AdminOverview } from './admin-overview'
import { AdminMasterList } from './admin-master-list'

/**
 * Admin portal entry point. Switches on the nav store view.
 * Sidebar already sets view to 'overview' | 'masterList'.
 */
export function AdminPortal() {
  const view = useNavStore((s) => s.view)

  if (view === 'masterList') {
    return <AdminMasterList />
  }

  return <AdminOverview />
}
