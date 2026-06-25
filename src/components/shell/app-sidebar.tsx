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
      <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar/95 text-sidebar-foreground backdrop-blur lg:flex">
        <nav
          aria-label="Primary navigation"
          className="scrollbar-thin sticky top-16 max-h-[calc(100vh-4rem)] flex-1 space-y-1.5 overflow-y-auto p-3"
        >
          {items.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              aria-current={view === item.key ? 'page' : undefined}
              className={cn(
                'relative h-11 w-full justify-start gap-3 rounded-lg px-3 font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring',
                view === item.key &&
                  'bg-secondary font-semibold text-primary shadow-sm hover:bg-secondary hover:text-primary before:absolute before:start-0 before:top-2 before:h-7 before:w-1 before:rounded-e-full before:bg-primary'
              )}
              onClick={() => setView(item.key)}
            >
              <item.icon className="size-[1.125rem] shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary navigation"
        className="safe-bottom scrollbar-thin fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar/95 px-2 py-1.5 text-sidebar-foreground shadow-lg backdrop-blur lg:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            aria-label={t(item.labelKey)}
            aria-current={view === item.key ? 'page' : undefined}
            className={cn(
              'flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              view === item.key ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
