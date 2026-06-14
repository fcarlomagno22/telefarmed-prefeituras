import type { ReactNode } from 'react'
import type { PrefeituraSlaStatus } from '../../types/prefeituraDashboard'
import type { SituationStatusBadgeStyle } from '../ui/SituationStatusBadge'

export function formatPrefeituraNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export const prefeituraSlaBadgeConfig: Record<PrefeituraSlaStatus, SituationStatusBadgeStyle> = {
  normal: {
    label: 'Normal',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.45)]',
  },
  atencao: {
    label: 'Atenção',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  critico: {
    label: 'Crítico',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.45)]',
  },
}

export const prefeituraSlaDotClass: Record<PrefeituraSlaStatus, string> = {
  normal: 'bg-emerald-500',
  atencao: 'bg-amber-500',
  critico: 'bg-red-500',
}

/** Miolo compartilhado: Consultas por hora e Alertas em destaque (mesma altura). */
export const prefDashboardHourlyAlertsBodyClass = 'flex h-[8rem] flex-col overflow-hidden'

/** Miolo compartilhado: Consultas por região e SLA por unidade (mesma altura). */
export const prefDashboardRegionSlaBodyClass = 'flex min-h-0 flex-1 flex-col p-4'

/** Miolo do card Consultas por especialidade (preenche altura da linha). */
export const prefDashboardSpecialtyBodyClass = 'flex min-h-0 flex-1 flex-col p-3'

/** Miolo do card Consultas por região (preenche altura da linha). */
export const prefDashboardRegionBodyClass = 'flex min-h-0 flex-1 flex-col p-3'

type DashCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  bodyClassName?: string
  /** Altura mínima estável + scroll interno no corpo (não encolhe com a viewport). */
  fillHeight?: boolean
}

export function DashCard({
  title,
  subtitle,
  children,
  action,
  className = '',
  bodyClassName = 'p-4',
  fillHeight = false,
}: DashCardProps) {
  return (
    <article
      className={[
        'overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        fillHeight ? 'flex h-full min-h-[14rem] w-full flex-col' : 'shrink-0',
        className,
      ].join(' ')}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div
        className={[
          fillHeight ? 'flex min-h-0 flex-1 flex-col' : '',
          bodyClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </article>
  )
}

export function DashLinkAction({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center text-xs font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-primary-hover)]"
    >
      {children}
    </button>
  )
}

export function DashLiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Atualizado há 1 min
    </span>
  )
}
