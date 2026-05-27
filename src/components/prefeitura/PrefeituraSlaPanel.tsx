import { ChevronRight } from 'lucide-react'
import type { PrefeituraSlaRow } from '../../utils/prefeituraDashboardFilters'
import {
  DashCard,
  DashLinkAction,
  prefDashboardRegionSlaBodyClass,
  prefeituraSlaBadgeConfig,
  prefeituraSlaDotClass,
} from './prefeituraDashboardUi'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from './prefeituraChartAnimation'

const waitMinutes = (wait: string) => parseInt(wait, 10) || 0

type PrefeituraSlaPanelProps = {
  rows: PrefeituraSlaRow[]
  animationKey: string
  className?: string
  onOpenAll: () => void
}

export function PrefeituraSlaPanel({
  rows,
  animationKey,
  className = '',
  onOpenAll,
}: PrefeituraSlaPanelProps) {
  const animate = usePrefeituraChartAnimation(200, animationKey)
  const maxWait = Math.max(...rows.map((r) => waitMinutes(r.wait)), 1)

  return (
    <DashCard
      title="SLA por unidade"
      subtitle="Tempo médio de espera nas UBT"
      fillHeight
      className={className}
      bodyClassName={prefDashboardRegionSlaBodyClass}
      action={
        <DashLinkAction onClick={onOpenAll}>
          Ver todas
          <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
        </DashLinkAction>
      }
    >
      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-gray-500">
          Nenhuma unidade no recorte
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
          {rows.map((row, index) => {
            const minutes = waitMinutes(row.wait)
            const widthPercent = (minutes / maxWait) * 100
            const badge = prefeituraSlaBadgeConfig[row.status]

            return (
              <li key={row.unit}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-semibold text-gray-800">
                    {row.unit.replace(/^UBT /, '')}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${prefeituraSlaDotClass[row.status]}`}
                      aria-hidden
                    />
                    <span className={`text-[11px] font-bold ${badge.text}`}>{badge.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      key={`${animationKey}-${row.unit}`}
                      className={`h-full rounded-full ${badge.accent}`}
                      style={{
                        width: animate ? `${widthPercent}%` : '0%',
                        transition: `width 0.8s ${PREF_CHART_EASE} ${index * 0.06}s`,
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs font-bold tabular-nums text-gray-700">
                    {row.wait}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}
