'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useNavStore } from '@/stores/nav-store'
import { useI18n } from '@/lib/i18n'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Languages, Moon, Sun, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function AppHeader() {
  const { user, logout } = useAuthStore()
  const { setView } = useNavStore()
  const { t, locale, toggleLocale } = useI18n()
  const { theme, setTheme } = useTheme()

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  async function handleLogout() {
    await logout()
    toast.success(t('common.success'))
  }

  function handleDashboardClick() {
    setView('overview')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-[3.75rem] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        <button
          type="button"
          onClick={handleDashboardClick}
          aria-label="Go to dashboard"
          className="rounded-lg p-1 text-start transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <BrandLogo showText className="[&>div:last-child]:hidden sm:[&>div:last-child]:block" />
        </button>

        <div className="ms-auto flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/80 bg-background/70 p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLocale}
              aria-label={t('lang.aria')}
              title={locale === 'en' ? 'العربية' : 'English'}
              className="size-8 rounded-md hover:bg-secondary"
            >
              <Languages className="size-4" />
              <span className="text-xs font-semibold">{locale === 'en' ? 'ع' : 'EN'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t('theme.aria')}
              className="size-8 rounded-md hover:bg-secondary"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-lg border border-border/80 bg-background/70 ps-1.5 pe-2 shadow-sm hover:bg-secondary"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-primary mt-1">{t(`role.${user?.role.toLowerCase()}`)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4 me-2" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
