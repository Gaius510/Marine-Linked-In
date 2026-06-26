'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useNavStore } from '@/stores/nav-store'
import type { Role } from '@/lib/types'
import {
  VIEW_QUERY_PARAM,
  coerceViewForRole,
  getSafeViewFromSlug,
  getSafeViewSlugForRole,
  getViewSlug,
} from '@/lib/navigation'

function buildViewUrl(pathname: string, searchParams: { toString: () => string }, viewSlug: string): string {
  const params = new URLSearchParams(searchParams.toString())
  params.set(VIEW_QUERY_PARAM, viewSlug)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function useUrlViewSync(role: Role | null | undefined): boolean {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = useNavStore((state) => state.view)
  const setView = useNavStore((state) => state.setView)
  const syncSnapshot = useNavStore((state) => state.urlSyncSnapshot)
  const setUrlSyncSnapshot = useNavStore((state) => state.setUrlSyncSnapshot)

  const searchKey = searchParams.toString()
  const urlView = searchParams.get(VIEW_QUERY_PARAM)
  const roleChanged = syncSnapshot.role !== role
  const urlChanged = syncSnapshot.pathname !== pathname || syncSnapshot.searchKey !== searchKey
  const safeUrlView = role ? getSafeViewFromSlug(role, urlView) : null
  const safeUrlSlug = role && safeUrlView ? getSafeViewSlugForRole(role, safeUrlView) : null
  const ready = !role || (!roleChanged && !urlChanged) || (view === safeUrlView && urlView === safeUrlSlug)

  useEffect(() => {
    if (!role) {
      setUrlSyncSnapshot({ role: null, pathname, searchKey, view })
      return
    }

    const viewChanged = syncSnapshot.view !== view

    if (roleChanged || urlChanged) {
      const safeView = getSafeViewFromSlug(role, urlView)
      const safeSlug = getSafeViewSlugForRole(role, safeView)

      if (urlView !== safeSlug) {
        router.replace(buildViewUrl(pathname, searchParams, safeSlug), { scroll: false })
      }

      if (useNavStore.getState().view !== safeView) {
        setView(safeView)
      }

      setUrlSyncSnapshot({ role, pathname, searchKey, view: safeView })
      return
    }

    if (viewChanged) {
      const safeView = coerceViewForRole(role, view)
      if (safeView !== view) {
        setView(safeView)
        setUrlSyncSnapshot({ role, pathname, searchKey, view: safeView })
        return
      }

      const targetSlug = getViewSlug(safeView)
      if (targetSlug && urlView !== targetSlug) {
        router.push(buildViewUrl(pathname, searchParams, targetSlug), { scroll: false })
      }

      setUrlSyncSnapshot({ role, pathname, searchKey, view: safeView })
      return
    }

    setUrlSyncSnapshot({ role, pathname, searchKey, view })
  }, [
    pathname,
    role,
    roleChanged,
    router,
    searchKey,
    searchParams,
    setUrlSyncSnapshot,
    setView,
    syncSnapshot.view,
    urlChanged,
    urlView,
    view,
  ])

  return ready
}
