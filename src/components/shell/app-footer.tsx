'use client'

import { useI18n } from '@/lib/i18n'
import { BrandLogo } from '@/components/shared/brand-logo'
import { brand } from '@/lib/brand'
import { Globe } from 'lucide-react'

export function AppFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border/70 bg-card/70 backdrop-blur">
      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span className="font-semibold text-foreground">{brand.name}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5" />
            <span>© {year} {brand.name}. {t('footer.rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
