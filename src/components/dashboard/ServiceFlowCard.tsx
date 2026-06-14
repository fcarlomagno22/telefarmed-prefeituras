import { CheckCircle2, Clock, Phone, Users } from 'lucide-react'
import { brand } from '../../config/brand'
import { FLUXO_CARD_HEIGHT_CLASS } from '../../constants/dashboardCards'
import type { UbtDashboardFilaResumoItem } from '../../types/ubtDashboard'

const flowIcons = [Users, Clock, CheckCircle2, Phone]

const barColors = {
  orange:
    'bg-gradient-to-r from-orange-300 via-[var(--brand-primary)] to-orange-600',
  green: 'bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-700',
  red: 'bg-gradient-to-r from-red-300 via-red-500 to-red-700',
}

type ServiceFlowCardProps = {
  items: UbtDashboardFilaResumoItem[]
  isLoading?: boolean
}

export function ServiceFlowCard({ items, isLoading }: ServiceFlowCardProps) {
  if (isLoading) {
    return (
      <section
        className={`relative ${FLUXO_CARD_HEIGHT_CLASS} animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-gray-50`}
      />
    )
  }

  if (items.length === 0) return null

  return (
    <section
      className={`relative ${FLUXO_CARD_HEIGHT_CLASS} overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]`}
    >
      <h2 className="relative z-10 text-sm font-semibold text-gray-800">
        Fluxo de Atendimento
      </h2>

      <ul className="relative z-10 mt-4 w-full max-w-[85%] space-y-4 pr-1 sm:max-w-[88%]">
        {items.map((item, index) => {
          const Icon = flowIcons[index] ?? Users
          return (
            <li key={item.label}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                <span className="text-lg font-bold text-gray-900">{item.count}</span>
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
              <span className="mt-2 block h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <span
                  className={`block h-full rounded-full ${barColors[item.tone]}`}
                  style={{ width: `${item.progress}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>

      <img
        src={brand.dashboardFlowImageUrl}
        alt=""
        className="pointer-events-none absolute -right-10 bottom-0 z-0 h-[300px] w-auto max-w-none translate-y-6 object-contain object-right-bottom opacity-50 sm:-right-8 sm:h-[320px] lg:h-[360px]"
      />
    </section>
  )
}
