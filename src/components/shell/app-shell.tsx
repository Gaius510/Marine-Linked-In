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
import { Loader2 } from 'lucide-react'

export function AppShell() {
  const { user, initialized, init } = useAuthStore()
  const { dir } = useI18n()

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
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
    <div dir={dir} className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <div className="flex flex-1 w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            {user.role === 'SEAFARER' && <SeafarerPortal />}
            {user.role === 'RECRUITER' && <RecruiterPortal />}
            {user.role === 'ADMIN' && <AdminPortal />}
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  )
}
