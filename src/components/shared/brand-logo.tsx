import { Anchor } from 'lucide-react'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandLogoSize = 'sm' | 'md' | 'lg'
type BrandLogoTone = 'default' | 'light'

const markSizes: Record<BrandLogoSize, string> = {
  sm: 'size-7 rounded-md',
  md: 'size-9 rounded-md',
  lg: 'size-12 rounded-lg',
}

const iconSizes: Record<BrandLogoSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-6',
}

export function BrandLogo({
  size = 'md',
  tone = 'default',
  showText = true,
  className,
}: {
  size?: BrandLogoSize
  tone?: BrandLogoTone
  showText?: boolean
  className?: string
}) {
  const light = tone === 'light'

  return (
    <div
      className={cn('inline-flex items-center gap-2.5', light ? 'text-white' : 'text-foreground', className)}
      aria-label={`${brand.name}: ${brand.tagline}`}
      role="img"
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden border',
          markSizes[size],
          light
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-primary bg-primary text-primary-foreground'
        )}
      >
        <Anchor className={iconSizes[size]} aria-hidden="true" />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className={cn('font-semibold leading-tight', size === 'lg' ? 'text-xl' : 'text-base')}>
            {brand.name}
          </div>
          <div className={cn('leading-tight', size === 'lg' ? 'text-sm' : 'text-[11px]', light ? 'text-white/72' : 'text-muted-foreground')}>
            {brand.tagline}
          </div>
        </div>
      )}
    </div>
  )
}
