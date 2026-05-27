import { useMemo, useState } from 'react'
import { agendaToday } from '../../../data/agendaMock'
import { buildPrefeituraAgendasHeatmapDays } from '../../../data/prefeituraAgendasMock'
import {
  getDefaultAgendasWeek,
  type PrefeituraAgendaUnitId,
} from '../../../data/prefeituraAgendasScheduleMock'
import { addDays, toDateKey } from '../../../utils/agendaDate'
import { parseIsoDate, toIsoDate } from '../../../utils/calendar'
import { PrefeituraAgendasDaySchedule } from './PrefeituraAgendasDaySchedule'
import {
  PrefeituraAgendasHeatmap,
  type PrefeituraAgendasHeatmapSelection,
} from './PrefeituraAgendasHeatmap'

const defaultWeek = getDefaultAgendasWeek(agendaToday)

export function PrefeituraAgendasMainPanel() {
  const [weekStart, setWeekStart] = useState(defaultWeek.start)
  const [weekEnd, setWeekEnd] = useState(defaultWeek.end)
  const [dayKeys, setDayKeys] = useState<string[]>(defaultWeek.dayKeys)
  const [unitFilter, setUnitFilter] = useState('todas')
  const [selection, setSelection] = useState<PrefeituraAgendasHeatmapSelection>({
    unitId: 'ubt-sao-francisco',
    dateKey: toIsoDate(agendaToday),
  })

  const heatmapDays = useMemo(() => buildPrefeituraAgendasHeatmapDays(dayKeys), [dayKeys])
  const isViewingCurrentWeek = weekStart === defaultWeek.start

  function goToTodayWeek() {
    setWeekStart(defaultWeek.start)
    setWeekEnd(defaultWeek.end)
    setDayKeys(defaultWeek.dayKeys)
    setSelection((current) => ({
      ...current,
      dateKey: toIsoDate(agendaToday),
    }))
  }

  function shiftWeek(direction: -1 | 1) {
    const start = parseIsoDate(weekStart)
    const end = parseIsoDate(weekEnd)
    if (!start || !end) return

    const nextStart = addDays(start, direction * 7)
    const nextEnd = addDays(end, direction * 7)
    const keys = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(nextStart, index)))

    setWeekStart(toIsoDate(nextStart))
    setWeekEnd(toIsoDate(nextEnd))
    setDayKeys(keys)

    const stillInWeek = keys.includes(selection.dateKey)
    if (!stillInWeek) {
      setSelection((current) => ({
        ...current,
        dateKey: keys[0] ?? current.dateKey,
      }))
    }
  }

  function handleUnitFilterChange(value: string) {
    setUnitFilter(value)
    if (value !== 'todas') {
      setSelection((current) => ({
        ...current,
        unitId: value as PrefeituraAgendaUnitId,
      }))
    }
  }

  const activeUnitId =
    unitFilter !== 'todas' ? (unitFilter as PrefeituraAgendaUnitId) : selection.unitId

  return (
    <div className="flex shrink-0 flex-col gap-4">
      <PrefeituraAgendasHeatmap
        weekStart={weekStart}
        weekEnd={weekEnd}
        dayKeys={dayKeys}
        unitFilter={unitFilter}
        selected={selection}
        onUnitFilterChange={handleUnitFilterChange}
        onSelectCell={setSelection}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
        onGoToToday={goToTodayWeek}
        showTodayButton={!isViewingCurrentWeek}
        todayKey={toDateKey(agendaToday)}
      />

      <PrefeituraAgendasDaySchedule
        unitId={activeUnitId}
        dateKey={selection.dateKey}
        maxDate={agendaToday}
        onUnitChange={(unitId) => {
          setSelection((current) => ({ ...current, unitId }))
          if (unitFilter !== 'todas') setUnitFilter(unitId)
        }}
        onDateChange={(dateKey) => {
          setSelection((current) => ({ ...current, dateKey }))
          if (heatmapDays.some((day) => day.key === dateKey)) return
          const date = parseIsoDate(dateKey)
          if (!date) return
          const week = getDefaultAgendasWeek(date)
          setWeekStart(week.start)
          setWeekEnd(week.end)
          setDayKeys(week.dayKeys)
        }}
      />
    </div>
  )
}
