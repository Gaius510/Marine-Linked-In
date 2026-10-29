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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BrandLogo } from '@/components/shared/brand-logo'
import { ChevronDown, Moon, Sun, LogOut } from 'lucide-react'
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
    toast.success(t('auth.logoutSuccess'))
  }

  function handleDashboardClick() {
    setView('overview')
  }

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleDashboardClick}
          aria-label="Go to dashboard"
          className="motion-button cursor-pointer rounded-sm p-1 text-start hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo showText className="[&>div:last-child]:hidden sm:[&>div:last-child]:block" />
        </button>

        <div className="ms-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={toggleLocale}
                aria-label={t('lang.aria')}
                className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {locale === 'en' ? 'AR' : 'EN'}
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {locale === 'en' ? 'العربية' : 'English'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={t('theme.aria')}
                className="size-8 min-h-8 min-w-8 text-muted-foreground hover:text-foreground"
              >
                <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>{t('theme.aria')}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-1.5 font-normal hover:bg-secondary/55"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs font-medium text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate text-sm sm:block">{user?.name}</span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
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
