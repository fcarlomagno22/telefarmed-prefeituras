import { useEffect, useState } from 'react'
import { auditLogsHourlyActivity, auditLogsSummary } from '../../data/auditLogsMock'
import {
  auditOverviewCardBodyClass,
  auditOverviewCardClass,
  auditOverviewCardSubtitleClass,
  auditOverviewCardTitleClass,
} from './auditOverviewCardStyles'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const BAR_MIN_PERCENT = 12
const X_LABEL_INDICES = new Set([0, 3, 6, 9, 11])

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function useChartAnimation(delayMs = 80) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return animate
}

export function AuditLogsPeriodSummaryCard() {
  const animate = useChartAnimation()
  const maxCount = Math.max(...auditLogsHourlyActivity.map((p) => p.count))
  const peakIndex = auditLogsHourlyActivity.findIndex((p) => p.count === maxCount)

  return (
    <section className={auditOverviewCardClass}>
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={auditOverviewCardTitleClass}>Resumo do período</h2>
          <p className={auditOverviewCardSubtitleClass}>Últimas 24 horas</p>
        </div>
        <p className="shrink-0 text-right text-xl font-bold tabular-nums text-gray-900">
          {formatNumber(auditLogsSummary.totalEvents)}
          <span className="ml-1 block text-xs font-semibold text-emerald-600 sm:ml-0 sm:inline">
            {auditLogsSummary.totalEventsTrend}
          </span>
        </p>
      </div>

      <div className={auditOverviewCardBodyClass}>
        <div
          className="flex min-h-[5.5rem] flex-1 flex-col justify-end"
          role="img"
          aria-label={`Atividade por hora nas últimas 24 horas. Pico às ${auditLogsSummary.peakHourLabel} com ${formatNumber(auditLogsSummary.peakHourCount)} eventos.`}
        >
          <div className="flex h-full min-h-0 items-end gap-0.5 sm:gap-1">
            {auditLogsHourlyActivity.map((point, index) => {
              const isPeak = index === peakIndex
              const heightPercent =
                maxCount > 0
                  ? Math.max(BAR_MIN_PERCENT, (point.count / maxCount) * 100)
                  : 0
              const showLabel = X_LABEL_INDICES.has(index)

              return (
                <div
                  key={point.label}
                  className="group relative flex h-full min-w-0 flex-1 flex-col items-center"
                >
                  <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-end">
                    <div
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      role="tooltip"
                    >
                      {point.label}: {formatNumber(point.count)} eventos
                    </div>

                    <button
                      type="button"
                      className={[
                        'relative w-full max-w-5 overflow-hidden rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1 sm:max-w-6',
                        isPeak ? 'shadow-[0_2px_8px_rgba(255,107,0,0.35)]' : '',
                      ].join(' ')}
                      style={{
                        height: animate ? `${heightPercent}%` : '0%',
                        background: isPeak
                          ? 'linear-gradient(to top, var(--brand-primary), #ff9a3d)'
                          : 'linear-gradient(to top, rgba(255,107,0,0.55), rgba(255,154,61,0.85))',
                        transition: `height 0.85s ${CHART_EASE} ${index * 0.04}s`,
                      }}
                      aria-label={`${point.label}: ${formatNumber(point.count)} eventos${isPeak ? ', pico do período' : ''}`}
                    />
                  </div>

                  {showLabel ? (
                    <span className="mt-1 shrink-0 text-[8px] font-medium leading-none text-gray-400 sm:text-[9px]">
                      {point.label}
                    </span>
                  ) : (
                    <span className="mt-1 h-[9px] shrink-0" aria-hidden />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto shrink-0 border-t border-gray-200 pt-2">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[10px] text-gray-500">Usuários ativos</dt>
              <dd className="mt-0.5 text-sm font-bold text-gray-900">{auditLogsSummary.activeUsers}</dd>
              <dd className="text-[10px] font-medium text-emerald-600">
                {auditLogsSummary.activeUsersTrend}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-gray-500">Críticos</dt>
              <dd className="mt-0.5 text-sm font-bold text-gray-900">
                {auditLogsSummary.criticalEvents}
              </dd>
              <dd className="text-[10px] font-medium text-red-600">
                {auditLogsSummary.criticalEventsTrend}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-gray-500">Sucesso</dt>
              <dd className="mt-0.5 text-sm font-bold text-gray-900">{auditLogsSummary.successRate}</dd>
              <dd className="text-[10px] font-medium text-emerald-600">
                {auditLogsSummary.successRateTrend}
              </dd>
            </div>
          </dl>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            Pico às {auditLogsSummary.peakHourLabel} ·{' '}
            {formatNumber(auditLogsSummary.peakHourCount)} eventos
          </p>
        </div>
      </div>
    </section>
  )
}
