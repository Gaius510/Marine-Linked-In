import { Link2, Waves } from 'lucide-react'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandLogoSize = 'sm' | 'md' | 'lg'
type BrandLogoTone = 'default' | 'light'

const markSizes: Record<BrandLogoSize, string> = {
  sm: 'size-7 rounded-md',
  md: 'size-9 rounded-lg',
  lg: 'size-14 rounded-2xl',
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
          'relative flex shrink-0 items-center justify-center overflow-hidden shadow-sm ring-1',
          markSizes[size],
          light
            ? 'bg-white/15 text-white ring-white/25'
            : 'bg-primary text-primary-foreground ring-primary/20'
        )}
      >
        <Waves className={cn('absolute -bottom-0.5 start-1 opacity-55', iconSizes[size])} aria-hidden="true" />
        <Link2 className={cn('relative z-10', iconSizes[size])} aria-hidden="true" />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className={cn('font-bold leading-tight tracking-tight', size === 'lg' ? 'text-2xl' : 'text-base')}>
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
