import type { ReactNode } from 'react'
import { brand } from '../../config/brand'

type LoginBackdropProps = {
  children: ReactNode
  /** Gradiente do overlay — tom mais azul e claro para prefeitura. */
  tone?: 'ubt' | 'prefeitura' | 'admin'
}

const toneLayers = {
  ubt: {
    base: 'bg-slate-950/50',
    color: 'bg-gradient-to-br from-[var(--brand-primary)]/35 via-slate-900/55 to-slate-950/75',
    bottom: 'bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/30',
    vignette:
      'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.45)_55%,rgba(2,6,23,0.85)_100%)]',
    grain: 'opacity-[0.18]',
  },
  prefeitura: {
    base: 'bg-white/15',
    color:
      'bg-gradient-to-br from-sky-400/25 via-white/10 to-indigo-400/20',
    bottom: 'bg-gradient-to-t from-slate-900/25 via-transparent to-white/5',
    vignette:
      'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.12)_70%,rgba(30,58,138,0.22)_100%)]',
    grain: 'opacity-[0.08]',
  },
  admin: {
    base: 'bg-white/20',
    color:
      'bg-gradient-to-br from-violet-300/20 via-white/15 to-purple-400/15',
    bottom: 'bg-gradient-to-t from-slate-900/20 via-transparent to-white/10',
    vignette:
      'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.08)_70%,rgba(91,33,182,0.18)_100%)]',
    grain: 'opacity-[0.06]',
  },
} as const

const backdropBlurByTone = {
  ubt: 'backdrop-blur-[2px] backdrop-saturate-110',
  prefeitura: 'backdrop-blur-[1px] backdrop-saturate-105',
  admin: 'backdrop-blur-[1px] backdrop-saturate-105',
} as const

export function LoginBackdrop({ children, tone = 'ubt' }: LoginBackdropProps) {
  const layers = toneLayers[tone]
  const backgroundImageUrl =
    tone === 'prefeitura'
      ? brand.prefeituraBackgroundImageUrl
      : tone === 'admin'
        ? brand.adminBackgroundImageUrl
        : brand.backgroundImageUrl

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center overflow-hidden">
      <img
        src={backgroundImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full scale-[1.03] object-cover"
        fetchPriority="high"
      />

      <div className={`absolute inset-0 ${layers.base}`} aria-hidden />
      <div className={`absolute inset-0 ${layers.color}`} aria-hidden />
      <div className={`absolute inset-0 ${layers.bottom}`} aria-hidden />
      <div
        className={['absolute inset-0', backdropBlurByTone[tone]].join(' ')}
        aria-hidden
      />
      <div className={`absolute inset-0 ${layers.vignette}`} aria-hidden />

      <div
        className={[
          'login-page-grain pointer-events-none absolute inset-0 mix-blend-overlay',
          layers.grain,
        ].join(' ')}
        aria-hidden
      />

      {children}
    </div>
  )
}
