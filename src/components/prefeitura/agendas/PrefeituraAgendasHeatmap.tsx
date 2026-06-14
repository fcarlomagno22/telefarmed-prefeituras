import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useMemo } from 'react'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  buildPrefeituraAgendasHeatmapDays,
  getAttendanceLevel,
  type HeatmapDayColumn,
  type HeatmapUnitRow,
} from '../../../data/prefeituraAgendasMock'
import {
  attendanceCellStyles,
  attendanceLegend,
  formatAgendasWeekRangeLabel,
  HEATMAP_VISIBLE_UNIT_ROWS,
  heatmapUnitsBodyMaxHeightClass,
  prefeituraAgendasScrollClass,
} from './prefeituraAgendasUi'

export type PrefeituraAgendasHeatmapSelection = {
  unitId: string
  dateKey: string
}

type PrefeituraAgendasHeatmapProps = {
  weekStart: string
  weekEnd: string
  dayKeys: string[]
  unitFilter: string
  unitFilterOptions: Array<{ value: string; label: string }>
  heatmapRows: HeatmapUnitRow[]
  selected: PrefeituraAgendasHeatmapSelection
  onUnitFilterChange: (value: string) => void
  onSelectCell: (selection: PrefeituraAgendasHeatmapSelection) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onGoToToday: () => void
  /** Exibe o atalho para voltar à semana do dia atual após navegar para outra semana. */
  showTodayButton?: boolean
  /** Data de hoje (yyyy-mm-dd) para destacar a coluna do dia atual na semana. */
  todayKey: string
}

export function PrefeituraAgendasHeatmap({
  weekStart,
  weekEnd,
  dayKeys,
  unitFilter,
  unitFilterOptions,
  heatmapRows,
  selected,
  onUnitFilterChange,
  onSelectCell,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  showTodayButton = false,
  todayKey,
}: PrefeituraAgendasHeatmapProps) {
  const heatmapDays: HeatmapDayColumn[] = useMemo(
    () => buildPrefeituraAgendasHeatmapDays(dayKeys),
    [dayKeys],
  )

  const rows = heatmapRows

  const weekLabel = formatAgendasWeekRangeLabel(weekStart, weekEnd)
  const hasMoreUnitsThanViewport = rows.length > HEATMAP_VISIBLE_UNIT_ROWS

  return (
    <section className="shrink-0 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-gray-100 px-4 py-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="min-w-[12rem] text-center">
            <span className="block text-sm font-semibold text-gray-800">{weekLabel}</span>
            <span className="mt-0.5 block text-[10px] font-medium text-gray-500">
              Domingo a sábado
            </span>
          </div>
          <button
            type="button"
            onClick={onNextWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            aria-label="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          {showTodayButton ? (
            <button
              type="button"
              onClick={onGoToToday}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/40 hover:bg-orange-50 hover:text-[var(--brand-primary)]"
            >
              Hoje
            </button>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Comparecimento</span>
            {attendanceLegend.map((item) => (
              <span key={item.level} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                {item.label}
              </span>
            ))}
          </div>

          <div className="w-full min-w-[12rem] shrink-0 sm:w-auto sm:min-w-[14rem]">
            <CustomSelect
              value={unitFilter}
              onChange={onUnitFilterChange}
              options={unitFilterOptions}
              aria-label="Filtrar unidade"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          className={[
            'overflow-x-auto rounded-xl border border-gray-100',
            hasMoreUnitsThanViewport ? heatmapUnitsBodyMaxHeightClass : '',
            hasMoreUnitsThanViewport
              ? ['overflow-y-auto overscroll-y-contain', prefeituraAgendasScrollClass].join(' ')
              : '',
          ].join(' ')}
        >
          <table className="w-full min-w-[640px] border-separate border-spacing-1.5">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="w-[7.5rem] bg-white px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-500 shadow-[0_1px_0_0_rgb(243,244,246)]">
                Unidade
              </th>
              {heatmapDays.map((day) => {
                const isToday = day.key === todayKey
                return (
                  <th
                    key={day.key}
                    className="bg-white px-1 py-2 text-center text-xs font-bold text-gray-600 shadow-[0_1px_0_0_rgb(243,244,246)]"
                  >
                    <span className="inline-flex flex-col items-center">
                      <span className="block text-[10px] tracking-wider text-gray-400">
                        {day.weekdayShort}
                      </span>
                      <span className="mt-0.5 block">{day.dateLabel}</span>
                      {isToday ? (
                        <span className="mt-1 rounded-full bg-[var(--brand-primary)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Hoje
                        </span>
                      ) : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="rounded-lg bg-gray-50 px-3 py-2 text-left text-sm font-semibold text-gray-800"
                >
                  {row.name}
                </th>
                {row.cells.map((cell, index) => {
                  const dayKey = heatmapDays[index]?.key
                  if (!dayKey) return null

                  const level = getAttendanceLevel(cell.attendancePercent)
                  const styles = attendanceCellStyles[level]
                  const isSelected =
                    selected.unitId === row.id && selected.dateKey === dayKey
                  const hasResolved = cell.attended + cell.noShows > 0

                  return (
                    <td key={`${row.id}-${dayKey}`}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectCell({
                            unitId: row.id,
                            dateKey: dayKey,
                          })
                        }
                        className={[
                          'flex w-full min-w-[4.5rem] flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition hover:brightness-[0.98]',
                          styles.bg,
                          isSelected ? styles.ring : '',
                        ].join(' ')}
                        title={`${row.name} · ${heatmapDays[index]?.weekdayShort} ${heatmapDays[index]?.dateLabel}`}
                        aria-pressed={isSelected}
                      >
                        <span className={`text-sm font-bold ${styles.text}`}>
                          {hasResolved ? `${cell.attendancePercent}%` : '—'}
                        </span>
                        <span className={`mt-0.5 text-[11px] font-medium ${styles.subtext}`}>
                          {hasResolved
                            ? `${cell.attended}/${cell.attended + cell.noShows}`
                            : `${cell.total} agend.`}
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
          Clique em uma unidade e dia para ver a agenda detalhada abaixo
        </span>
        {hasMoreUnitsThanViewport ? (
          <span className="text-gray-400">
            · Role para ver as demais unidades ({rows.length} no total)
          </span>
        ) : null}
      </p>
    </section>
  )
}
