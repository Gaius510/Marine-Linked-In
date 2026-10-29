'use client'

import { useNavStore } from '@/stores/nav-store'
import { useAuthStore } from '@/stores/auth-store'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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
  const roleLabel = user?.role ? t(`role.${user.role.toLowerCase()}`) : ''

  return (
    <>
      <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col self-stretch overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="shrink-0 px-4 pb-2 pt-4">
          <div className="truncate text-xs font-medium text-muted-foreground">{roleLabel}</div>
        </div>
        <nav
          aria-label="Primary navigation"
          className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-3"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={view === item.key ? 'page' : undefined}
              className={cn(
                'motion-nav-item relative flex h-8 w-full items-center gap-2.5 rounded-sm px-3 text-sm font-normal text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                view === item.key &&
                  'bg-secondary/70 font-medium text-primary hover:bg-secondary/70 hover:text-primary before:absolute before:inset-y-1 before:start-0 before:w-0.5 before:bg-primary'
              )}
              onClick={() => setView(item.key)}
            >
              <item.icon className="size-[1.125rem] shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <nav
        aria-label="Primary navigation"
        className="safe-bottom scrollbar-thin fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar px-2 py-1 text-sidebar-foreground lg:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            aria-label={t(item.labelKey)}
            aria-current={view === item.key ? 'page' : undefined}
            className={cn(
              'motion-nav-item relative flex min-w-[4.25rem] flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              view === item.key
                ? 'text-primary before:absolute before:top-0 before:h-0.5 before:w-6 before:bg-primary'
                : 'text-muted-foreground hover:text-sidebar-accent-foreground'
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
