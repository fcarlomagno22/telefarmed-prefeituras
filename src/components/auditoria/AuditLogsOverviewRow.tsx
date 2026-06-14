import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react'
import { AuditEventsByTypeBarChart } from './AuditEventsByTypeBarChart'
import { AuditLogsPeriodSummaryCard } from './AuditLogsPeriodSummaryCard'
import { useAuditLogsScopeContext } from './AuditLogsScopeContext'
import {
  auditOverviewCardBodyClass,
  auditOverviewCardClass,
  auditOverviewCardSubtitleClass,
  auditOverviewCardTitleClass,
} from './auditOverviewCardStyles'

type AuditLogsOverviewRowProps = {
  onViewAllCritical?: () => void
}

export function AuditLogsOverviewRow({ onViewAllCritical }: AuditLogsOverviewRowProps) {
  const { dataset } = useAuditLogsScopeContext()
  const { byType, criticalBreakdown } = dataset

  return (
    <div className="grid w-full min-w-0 shrink-0 grid-cols-1 gap-3 lg:min-h-[17.5rem] lg:grid-cols-3 lg:items-stretch lg:gap-4">
      <AuditLogsPeriodSummaryCard />

      <section className={auditOverviewCardClass}>
        <div className="shrink-0">
          <h2 className={auditOverviewCardTitleClass}>Eventos por tipo</h2>
          <p className={auditOverviewCardSubtitleClass}>Últimas 24 horas</p>
        </div>

        <div className={auditOverviewCardBodyClass}>
          <AuditEventsByTypeBarChart slices={byType} className="min-h-0 flex-1" />
        </div>
      </section>

      <section className={auditOverviewCardClass}>
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div>
            <h2 className={auditOverviewCardTitleClass}>Eventos críticos</h2>
            <p className={auditOverviewCardSubtitleClass}>Últimas 24 horas</p>
          </div>
          <button
            type="button"
            onClick={onViewAllCritical}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:underline"
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <ul className="mt-3 grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-2">
          {criticalBreakdown.map((item) => {
            const isPermission = item.key === 'permissions'
            return (
              <li
                key={item.key}
                className="flex h-full min-h-[5.5rem] min-w-0 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-2.5 text-center"
              >
                <span
                  className={`mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isPermission ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {isPermission ? (
                    <ShieldAlert className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
                <span className="text-[10px] font-medium leading-snug text-gray-800">{item.label}</span>
                <span className="mt-1 text-xl font-bold tabular-nums text-gray-900">{item.count}</span>
                <span
                  className={`mt-0.5 text-[11px] font-semibold ${
                    isPermission ? 'text-orange-600' : 'text-red-600'
                  }`}
                >
                  {item.trend}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
