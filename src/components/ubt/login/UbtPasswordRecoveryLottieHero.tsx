import type { ReactNode } from 'react'

const sizeClasses = {
  md: 'h-40 w-40',
  lg: 'h-48 w-48',
  xl: 'h-56 w-56',
} as const

type UbtPasswordRecoveryLottieHeroProps = {
  children: ReactNode
  size?: keyof typeof sizeClasses
  accent?: 'brand' | 'success'
}

export function UbtPasswordRecoveryLottieHero({
  children,
  size = 'lg',
  accent = 'brand',
}: UbtPasswordRecoveryLottieHeroProps) {
  const glowClass = accent === 'success' ? 'bg-emerald-400/20' : 'bg-[var(--brand-primary)]/15'

  return (
    <div className="relative mx-auto flex w-full justify-center px-6 py-5">
      <span
        className={`absolute top-1/2 aspect-square w-[min(100%,16rem)] -translate-y-1/2 rounded-full ${glowClass} blur-3xl`}
        aria-hidden
      />
      <span
        className="absolute top-1/2 aspect-square w-[min(72%,11rem)] -translate-y-1/2 rounded-full bg-white ring-1 ring-gray-100/90 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
        aria-hidden
      />
      <div
        className={`relative shrink-0 ${sizeClasses[size]} [&_>div]:h-full [&_>div]:w-full [&_svg]:h-full [&_svg]:w-full`}
      >
        {children}
      </div>
    </div>
  )
}
