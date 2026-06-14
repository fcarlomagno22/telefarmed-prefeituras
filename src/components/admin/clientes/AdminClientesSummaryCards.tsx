import { Building2, PauseCircle, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ClientesSummaryResponse } from '../../../lib/services/admin/clientes'
import { adminClientesCardsRowClass, formatAdminClientesNumber } from './adminClientesUi'

type SummaryCard = {
  label: string
  value: number
  trend: string
  trendClass: string
  icon: LucideIcon
  iconGradient: string
  iconRing: string
  topBar: string
}

function buildCards(summary: ClientesSummaryResponse | null): SummaryCard[] {
  return [
    {
      label: 'Entidades ativas',
      value: summary?.ativas ?? 0,
      trend: summary?.ativasTrend ?? '—',
      trendClass: 'text-emerald-600',
      icon: Building2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Em implantação',
      value: summary?.implantacao ?? 0,
      trend: summary?.implantacaoTrend ?? '—',
      trendClass: 'text-blue-600',
      icon: Rocket,
      iconGradient: 'from-blue-500 via-sky-500 to-cyan-600',
      iconRing: 'ring-sky-100/80',
      topBar: 'from-blue-400 to-cyan-500',
    },
    {
      label: 'Prospects',
      value: summary?.prospects ?? 0,
      trend: summary?.prospectsTrend ?? '—',
      trendClass: 'text-violet-600',
      icon: Users,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Suspensas',
      value: summary?.suspensas ?? 0,
      trend: summary?.suspensasTrend ?? '—',
      trendClass: 'text-orange-600',
      icon: PauseCircle,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
  ]
}

type AdminClientesSummaryCardsProps = {
  summary: ClientesSummaryResponse | null
  isLoading?: boolean
}

export function AdminClientesSummaryCards({
  summary,
  isLoading = false,
}: AdminClientesSummaryCardsProps) {
  const cards = buildCards(summary)

  return (
    <section className={adminClientesCardsRowClass} aria-label="Resumo de clientes">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.label}
            className="relative flex h-full min-h-[7.5rem] min-w-0 w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 px-4 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
            aria-busy={isLoading}
          >
            <span
              className={`absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r opacity-80 ${card.topBar}`}
              aria-hidden
            />
            <span
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-[3px]',
                card.iconGradient,
                card.iconRing,
              ].join(' ')}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </span>
            <div className="mt-2 w-full min-w-0">
              <p className="text-xs font-medium leading-snug text-gray-500">{card.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900">
                {formatAdminClientesNumber(card.value)}
              </p>
              <p className={`mt-0.5 text-[11px] font-medium leading-snug ${card.trendClass}`}>
                {card.trend}
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
