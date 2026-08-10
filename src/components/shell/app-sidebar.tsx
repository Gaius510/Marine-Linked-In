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
  const roleLabel = user?.role ? t(`role.${user.role.toLowerCase()}`) : ''

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col self-stretch overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="shrink-0 border-b border-sidebar-border px-4 py-3">
          <div>
            <div className="truncate text-[11px] font-semibold uppercase text-muted-foreground">
              {roleLabel}
            </div>
            <div className="mt-0.5 truncate text-sm font-medium">{t('common.dashboard')}</div>
          </div>
        </div>
        <nav
          aria-label="Primary navigation"
          className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3"
        >
          {items.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              aria-current={view === item.key ? 'page' : undefined}
              className={cn(
                'motion-nav-item relative h-9 w-full justify-start gap-2.5 rounded-md border border-transparent px-3 font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring',
                view === item.key &&
                  'border-primary/15 bg-secondary font-semibold text-primary hover:bg-secondary hover:text-primary before:absolute before:start-0 before:top-1.5 before:h-6 before:w-0.5 before:bg-primary'
              )}
              onClick={() => setView(item.key)}
            >
              <item.icon className="size-[1.125rem] shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Button>
          ))}
        </nav>
        {user && (
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <div className="min-w-0 px-2 py-1.5">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary navigation"
        className="safe-bottom scrollbar-thin fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar px-2 py-1.5 text-sidebar-foreground shadow-[0_-2px_8px_rgb(11_38_51_/_0.08)] lg:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            aria-label={t(item.labelKey)}
            aria-current={view === item.key ? 'page' : undefined}
            className={cn(
              'motion-nav-item relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-md border border-transparent px-2 py-1.5 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              view === item.key
                ? 'border-primary/15 bg-secondary text-primary before:absolute before:top-0 before:h-0.5 before:w-6 before:bg-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
