'use client'

import { useI18n } from '@/lib/i18n'
import { Anchor, Globe } from 'lucide-react'

export function AppFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t bg-background/60 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Anchor className="size-3.5" />
            </div>
            <span className="font-semibold text-foreground">{t('brand.name')}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5" />
            <span>© {year} {t('brand.name')}. {t('footer.rights')}</span>
          </div>
        </div>
      </div>
      {/* spacer for mobile bottom nav */}
      <div className="h-14 lg:hidden" />
    </footer>
  )
}
