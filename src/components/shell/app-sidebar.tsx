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
      <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col self-stretch overflow-hidden border-e border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-sm shadow-brand-navy/5 backdrop-blur-xl lg:flex">
        <div className="shrink-0 border-b border-sidebar-border/70 p-2.5">
          <div className="rounded-xl bg-sidebar-accent/55 px-3 py-2">
            <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {roleLabel}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold">{t('nav.overview')}</div>
          </div>
        </div>
        <nav
          aria-label="Primary navigation"
          className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2.5"
        >
          {items.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              aria-current={view === item.key ? 'page' : undefined}
              className={cn(
                'motion-nav-item relative h-10 w-full justify-start gap-2.5 rounded-xl border border-transparent px-3 font-medium text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring',
                view === item.key &&
                  'border-primary/20 bg-secondary font-semibold text-primary shadow-sm ring-1 ring-primary/10 hover:bg-secondary hover:text-primary before:absolute before:start-0 before:top-2 before:h-6 before:w-1 before:rounded-e-full before:bg-primary'
              )}
              onClick={() => setView(item.key)}
            >
              <item.icon className="size-[1.125rem] shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Button>
          ))}
        </nav>
        {user && (
          <div className="shrink-0 border-t border-sidebar-border/70 p-2.5">
            <div className="min-w-0 rounded-xl border border-sidebar-border/70 bg-background/60 px-3 py-2 shadow-sm">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary navigation"
        className="safe-bottom scrollbar-thin fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar/95 px-2 py-1.5 text-sidebar-foreground shadow-lg shadow-brand-navy/10 backdrop-blur-xl lg:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            aria-label={t(item.labelKey)}
            aria-current={view === item.key ? 'page' : undefined}
            className={cn(
              'motion-nav-item relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-xl border border-transparent px-2 py-1.5 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              view === item.key
                ? 'border-primary/20 bg-secondary text-primary shadow-sm ring-1 ring-primary/10 before:absolute before:top-0.5 before:h-0.5 before:w-6 before:rounded-full before:bg-primary'
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
