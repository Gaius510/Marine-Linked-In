'use client'

import { useNavStore } from '@/stores/nav-store'
import { useAuthStore } from '@/stores/auth-store'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, FileText, Briefcase, Send,
  Users, PlusCircle, ListChecks, Bookmark, CalendarClock, Mail,
  Database,
} from 'lucide-react'

interface NavItem {
  key: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
}

const seafarerNav: NavItem[] = [
  { key: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { key: 'cv', labelKey: 'nav.cv', icon: FileText },
  { key: 'jobs', labelKey: 'nav.jobs', icon: Briefcase },
  { key: 'applications', labelKey: 'nav.applications', icon: Send },
]

const recruiterNav: NavItem[] = [
  { key: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { key: 'browse', labelKey: 'nav.browse', icon: Users },
  { key: 'postJob', labelKey: 'nav.postJob', icon: PlusCircle },
  { key: 'myJobs', labelKey: 'nav.myJobs', icon: ListChecks },
  { key: 'saved', labelKey: 'nav.saved', icon: Bookmark },
  { key: 'interviews', labelKey: 'nav.interviews', icon: CalendarClock },
  { key: 'messages', labelKey: 'nav.messages', icon: Mail },
]

const adminNav: NavItem[] = [
  { key: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { key: 'masterList', labelKey: 'nav.masterList', icon: Database },
]

export function AppSidebar() {
  const { user } = useAuthStore()
  const { view, setView } = useNavStore()
  const { t } = useI18n()

  const items = user?.role === 'SEAFARER' ? seafarerNav : user?.role === 'RECRUITER' ? recruiterNav : adminNav

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-e bg-background/60 backdrop-blur">
        <nav className="flex-1 p-3 space-y-1 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
          {items.map((item) => (
            <Button
              key={item.key}
              variant={view === item.key ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start gap-3 h-10 font-normal', view === item.key && 'font-medium')}
              onClick={() => setView(item.key)}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur px-2 py-1.5 flex items-center justify-around safe-bottom">
        {items.slice(0, 5).map((item) => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors min-w-[48px]',
              view === item.key ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="size-5" />
            <span className="truncate max-w-[60px]">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
