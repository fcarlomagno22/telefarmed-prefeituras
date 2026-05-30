import { Link, useLocation } from 'react-router-dom'
import { UserCircle2 } from 'lucide-react'
import { profissionalRoutes } from '../../config/profissionalRoutes'

export function ProfissionalProfileLink() {
  const { pathname } = useLocation()
  const normalized = pathname.replace(/\/+$/, '')

  if (normalized === profissionalRoutes.perfil) return null

  return (
    <Link
      to={profissionalRoutes.perfil}
      className={[
        'group inline-flex min-w-[12.5rem] shrink-0 items-center justify-center gap-3',
        'rounded-2xl border-2 border-[var(--brand-primary)]/25',
        'bg-gradient-to-br from-white via-[var(--brand-primary-light)]/40 to-orange-50/80',
        'px-6 py-3 text-sm font-bold tracking-tight text-gray-800',
        'shadow-[0_2px_14px_rgba(255,107,0,0.1)] ring-1 ring-white/80',
        'transition duration-200',
        'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
        'hover:shadow-[0_6px_24px_rgba(255,107,0,0.18)]',
        'active:scale-[0.98]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-[var(--brand-primary)] to-orange-500 text-white',
          'shadow-[0_2px_8px_rgba(255,107,0,0.35)]',
          'transition duration-200 group-hover:scale-105 group-hover:shadow-[0_4px_12px_rgba(255,107,0,0.4)]',
        ].join(' ')}
        aria-hidden
      >
        <UserCircle2 className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="pr-0.5">Meu perfil</span>
    </Link>
  )
}
