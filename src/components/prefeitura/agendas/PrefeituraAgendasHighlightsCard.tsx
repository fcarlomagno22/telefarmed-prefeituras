import { AlertTriangle, Award, TrendingDown, TrendingUp } from 'lucide-react'
import { prefeituraAgendasHighlights } from '../../../data/prefeituraAgendasMock'
import type { HighlightItem } from '../../../data/prefeituraAgendasMock'
import { prefeituraAgendasBottomCardHeightClass } from './prefeituraAgendasUi'

const highlightConfig: Record<
  HighlightItem['tone'],
  { icon: typeof TrendingUp; iconWrap: string; iconColor: string }
> = {
  red: {
    icon: TrendingUp,
    iconWrap: 'bg-red-50 ring-red-100',
    iconColor: 'text-red-600',
  },
  green: {
    icon: TrendingDown,
    iconWrap: 'bg-emerald-50 ring-emerald-100',
    iconColor: 'text-emerald-600',
  },
  amber: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-50 ring-amber-100',
    iconColor: 'text-amber-600',
  },
  blue: {
    icon: Award,
    iconWrap: 'bg-sky-50 ring-sky-100',
    iconColor: 'text-sky-600',
  },
}

export function PrefeituraAgendasHighlightsCard() {
  return (
    <article
      className={[
        'flex shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasBottomCardHeightClass,
      ].join(' ')}
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Unidades em Destaque</h3>
      </header>
      <ul className="flex min-h-0 flex-1 flex-col gap-0 divide-y divide-gray-50 p-2">
        {prefeituraAgendasHighlights.map((item) => {
          const config = highlightConfig[item.tone]
          const Icon = config.icon

          return (
            <li key={item.id} className="flex items-start gap-3 px-2 py-3">
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
                  config.iconWrap,
                ].join(' ')}
              >
                <Icon className={`h-4 w-4 ${config.iconColor}`} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{item.subtitle}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
