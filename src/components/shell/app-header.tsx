'use client'

import { useAuthStore } from '@/stores/auth-store'
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
import { Anchor, Languages, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'

export function AppHeader() {
  const { user, logout } = useAuthStore()
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Anchor className="size-5" />
          </div>
          <div className="hidden sm:block">
            <div className="font-bold leading-tight">{t('brand.name')}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{t('brand.tagline')}</div>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            aria-label={t('lang.aria')}
            title={locale === 'en' ? 'العربية' : 'English'}
          >
            <Languages className="size-4" />
            <span className="text-xs font-semibold ms-1">{locale === 'en' ? 'ع' : 'EN'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('theme.aria')}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 ps-1.5 pe-2 h-9">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{user?.name}</span>
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
