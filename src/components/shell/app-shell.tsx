'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useNavStore } from '@/stores/nav-store'
import { useI18n } from '@/lib/i18n'
import { AuthScreen } from '@/components/auth/auth-screen'
import { AppHeader } from '@/components/shell/app-header'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppFooter } from '@/components/shell/app-footer'
import { useUrlViewSync } from '@/components/shell/use-url-view-sync'
import { SeafarerPortal } from '@/components/seafarer/seafarer-portal'
import { RecruiterPortal } from '@/components/recruiter/recruiter-portal'
import { AdminPortal } from '@/components/admin/admin-portal'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Loader2 } from 'lucide-react'

export function AppShell() {
  const { user, initialized, init } = useAuthStore()
  const view = useNavStore((state) => state.view)
  const { dir } = useI18n()
  const navigationReady = useUrlViewSync(user?.role)

  useEffect(() => {
    init()
  }, [init])

  if (!initialized || (user && !navigationReady)) {
    return (
      <div className="brand-surface-gradient flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandLogo size="lg" />
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
        <main className="min-w-0 flex-1">
          <AuthScreen />
        </main>
      </div>
    )
  }

  return (
    <div dir={dir} className="flex h-dvh max-h-dvh min-h-dvh w-full max-w-full flex-col overflow-hidden bg-background">
      <AppHeader />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden w-full max-w-full">
        <AppSidebar />
        <main className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,var(--brand-seafoam)_0%,transparent_36%),linear-gradient(180deg,var(--background)_0%,transparent_38%)]" />
          <div className="scrollbar-thin relative z-10 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 pb-20 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
            <div key={`${user.role}-${view}`} className="motion-view mx-auto w-full max-w-[1360px] min-w-0">
              {user.role === 'SEAFARER' && <SeafarerPortal />}
              {user.role === 'RECRUITER' && <RecruiterPortal />}
              {user.role === 'ADMIN' && <AdminPortal />}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  )
}
