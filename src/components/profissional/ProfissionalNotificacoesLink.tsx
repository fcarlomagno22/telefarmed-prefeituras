import { Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { profissionalRoutes } from '../../config/profissionalRoutes'
import { useProfissionalUnreadInbox } from '../../contexts/ProfissionalNotificacoesContext'

export function ProfissionalNotificacoesLink() {
  const { pathname } = useLocation()
  const hasUnread = useProfissionalUnreadInbox()
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const isActive = normalized === profissionalRoutes.notificacoes

  const className = [
    'group relative inline-flex h-12 w-12 shrink-0 items-center justify-center',
    'rounded-2xl border-2',
    isActive
      ? 'border-[var(--brand-primary)] bg-gradient-to-br from-[var(--brand-primary-light)]/60 via-orange-50 to-white text-[var(--brand-primary)] shadow-[0_4px_18px_rgba(255,107,0,0.2)] ring-2 ring-[var(--brand-primary)]/20'
      : 'border-[var(--brand-primary)]/25 bg-gradient-to-br from-white via-[var(--brand-primary-light)]/40 to-orange-50/80 text-[var(--brand-primary)] shadow-[0_2px_14px_rgba(255,107,0,0.1)] ring-1 ring-white/80',
    'transition duration-200',
    isActive
      ? ''
      : 'hover:border-[var(--brand-primary)] hover:shadow-[0_6px_24px_rgba(255,107,0,0.18)] active:scale-[0.98]',
  ].join(' ')

  const ariaLabel = isActive
    ? hasUnread
      ? 'Notificações — página atual, há mensagens não lidas'
      : 'Notificações — página atual'
    : hasUnread
      ? 'Notificações — há mensagens não lidas'
      : 'Notificações'

  if (isActive) {
    return (
      <span className={className} aria-label={ariaLabel} aria-current="page">
        <Bell className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        {hasUnread ? (
          <span
            className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </span>
    )
  }

  return (
    <Link
      to={profissionalRoutes.notificacoes}
      className={className}
      aria-label={ariaLabel}
    >
      <Bell className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      {hasUnread ? (
        <span
          className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </Link>
  )
}
