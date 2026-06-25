'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useNavStore } from '@/stores/nav-store'
import { useI18n } from '@/lib/i18n'
import { AuthScreen } from '@/components/auth/auth-screen'
import { AppHeader } from '@/components/shell/app-header'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppFooter } from '@/components/shell/app-footer'
import { SeafarerPortal } from '@/components/seafarer/seafarer-portal'
import { RecruiterPortal } from '@/components/recruiter/recruiter-portal'
import { AdminPortal } from '@/components/admin/admin-portal'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Loader2 } from 'lucide-react'

export function AppShell() {
  const { user, initialized, init } = useAuthStore()
  const { dir } = useI18n()

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <BrandLogo size="lg" />
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <AuthScreen />
        </main>
      </div>
    )
  }

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 w-full">
        <AppSidebar />
        <main className="relative isolate flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,var(--brand-seafoam)_0%,transparent_42%)]" />
          <div className="relative z-10 flex-1 px-4 py-5 pb-20 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-[1360px]">
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
