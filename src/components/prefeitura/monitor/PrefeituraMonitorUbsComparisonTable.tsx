import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  monitorComparisonPrimaryColumn,
  monitorComparisonTabs,
  type MonitorComparisonRow,
  type MonitorComparisonTab,
} from '../../../data/prefeituraMonitorMock'
import { monitorCardTableScrollClass, monitorTableHeadStickyClass } from './monitorTableScroll'

type PrefeituraMonitorUbsComparisonTableProps = {
  activeTab: MonitorComparisonTab
  onTabChange: (tab: MonitorComparisonTab) => void
  rows: MonitorComparisonRow[]
  stickyHeader?: boolean
  /** Tabela com scroll interno (card da página). */
  scrollable?: boolean
}

export function PrefeituraMonitorUbsComparisonTable({
  activeTab,
  onTabChange,
  rows,
  stickyHeader = false,
  scrollable = false,
}: PrefeituraMonitorUbsComparisonTableProps) {
  const column = monitorComparisonPrimaryColumn[activeTab]
  const tableScrollClass = scrollable
    ? monitorCardTableScrollClass
    : stickyHeader
      ? 'min-h-0 flex-1 overflow-auto'
      : 'overflow-x-auto'
  const headStickyClass =
    scrollable || stickyHeader ? monitorTableHeadStickyClass : undefined

  return (
    <div className={scrollable ? 'flex min-h-0 flex-1 flex-col' : 'contents'}>
      <div
        className={[
          'flex shrink-0 gap-0 overflow-x-auto border-b border-gray-100 px-2',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        ].join(' ')}
        role="tablist"
        aria-label="Indicadores do comparativo"
      >
        {monitorComparisonTabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={[
                'shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm',
                active
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-800',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className={tableScrollClass}>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className={headStickyClass}>
            <tr className="border-b border-gray-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-20 px-4 py-3">Posição</th>
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3">{column.header}</th>
              <th className="px-4 py-3 text-right">Variação (dia anterior)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  Nenhuma unidade no ranking deste indicador
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const barWidth =
                row.primaryMax > 0 ? Math.round((row.primaryValue / row.primaryMax) * 100) : 0
              const positive = row.variationPercent > 0
              const negative = row.variationPercent < 0
              const neutral = row.variationPercent === 0

              return (
                <tr key={`${activeTab}-${row.position}-${row.unitName}`} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-xs font-bold tabular-nums text-gray-500">
                    {row.position}º
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{row.unitName}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[10rem] items-center gap-3">
                      <span className="shrink-0 text-xs font-bold tabular-nums text-gray-800">
                        {column.format(row.primaryValue)}
                      </span>
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-700 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={[
                        'inline-flex items-center justify-end gap-0.5 text-xs font-bold tabular-nums',
                        positive ? 'text-emerald-600' : negative ? 'text-red-600' : 'text-gray-500',
                      ].join(' ')}
                    >
                      {positive ? (
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      ) : negative ? (
                        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      ) : null}
                      {neutral ? '—' : `${positive ? '+' : ''}${row.variationPercent}%`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
