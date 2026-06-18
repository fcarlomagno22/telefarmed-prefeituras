import { brand } from '../../config/brand'

type PoweredByTelefarmedProps = {
  className?: string
}

export function PoweredByTelefarmed({ className = '' }: PoweredByTelefarmedProps) {
  return (
    <div className={['inline-flex items-center gap-1.5', className].filter(Boolean).join(' ')}>
      <span className="text-[9px] font-medium lowercase tracking-wide text-gray-500 sm:text-[10px]">
        powered by
      </span>
      <img
        src={brand.logoUrl}
        alt={brand.appName}
        className="h-3.5 w-auto max-w-[72px] object-contain sm:h-4 sm:max-w-[80px]"
      />
    </div>
  )
}
