import { AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import type { PrefeituraAlert } from '../../data/prefeituraDashboardMock'
import { DashCard, DashLinkAction } from './prefeituraDashboardUi'

type PrefeituraAlertsPanelProps = {
  className?: string
  alerts: PrefeituraAlert[]
  totalCount: number
  onOpenAll: () => void
}

export function PrefeituraAlertsPanel({
  className = '',
  alerts,
  totalCount,
  onOpenAll,
}: PrefeituraAlertsPanelProps) {
  return (
    <DashCard
      title="Alertas em destaque"
      subtitle="Situações que exigem atenção imediata"
      fillHeight
      className={className}
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      action={
        <span className="inline-flex items-center gap-2">
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {totalCount}
          </span>
          <DashLinkAction onClick={onOpenAll}>
            Ver todos
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
          </DashLinkAction>
        </span>
      }
    >
      {alerts.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-gray-500">
          Nenhum alerta para os filtros aplicados
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical'

            return (
              <li
                key={alert.id}
                className={[
                  'border-l-4',
                  isCritical ? 'border-l-red-500 bg-red-50/40' : 'border-l-amber-400 bg-amber-50/30',
                ].join(' ')}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/60"
                >
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
                    ].join(' ')}
                  >
                    {isCritical ? (
                      <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Clock className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
                        {alert.title}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-gray-400">
                        {alert.timeAgo}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-600">{alert.unit}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}
