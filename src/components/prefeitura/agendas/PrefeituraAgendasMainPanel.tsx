import { useMemo } from 'react'
import { buildPrefeituraAgendasHeatmapDays, filterHeatmapRows } from '../../../data/prefeituraAgendasMock'
import type { HeatmapUnitRow } from '../../../data/prefeituraAgendasMock'
import type { PrefeituraAgendaDayApi, PrefeituraAgendaCatalogApi, PrefeituraAgendaWeekApi } from '../../../lib/services/prefeitura/agendas'
import type { PrefeituraAgendaUnitApi } from '../../../lib/services/prefeitura/agendas'
import { PrefeituraAgendasDaySchedule } from './PrefeituraAgendasDaySchedule'
import {
  PrefeituraAgendasHeatmap,
  type PrefeituraAgendasHeatmapSelection,
} from './PrefeituraAgendasHeatmap'

type PrefeituraAgendasMainPanelProps = {
  catalog: PrefeituraAgendaCatalogApi | null
  weekStart: string
  weekEnd: string
  dayKeys: string[]
  unitFilter: string
  selection: PrefeituraAgendasHeatmapSelection
  weekData: PrefeituraAgendaWeekApi | null
  dayData: PrefeituraAgendaDayApi | null
  todayKey: string
  isViewingCurrentWeek: boolean
  onSelectionChange: (selection: PrefeituraAgendasHeatmapSelection) => void
  onUnitFilterChange: (value: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onGoToTodayWeek: () => void
  onGoToWeekContainingDate: (dateKey: string) => void
  findUnit: (unitId: string) => PrefeituraAgendaUnitApi | undefined
  getUnitOptionsForRegion: (regionKey: string) => Array<{ value: string; label: string }>
}

export function PrefeituraAgendasMainPanel({
  catalog,
  weekStart,
  weekEnd,
  dayKeys,
  unitFilter,
  selection,
  weekData,
  dayData,
  todayKey,
  isViewingCurrentWeek,
  onSelectionChange,
  onUnitFilterChange,
  onPrevWeek,
  onNextWeek,
  onGoToTodayWeek,
  onGoToWeekContainingDate,
  findUnit,
  getUnitOptionsForRegion,
}: PrefeituraAgendasMainPanelProps) {
  const heatmapDays = useMemo(() => buildPrefeituraAgendasHeatmapDays(dayKeys), [dayKeys])

  const heatmapRows = useMemo(() => {
    const rows = weekData?.heatmapRows ?? []
    return filterHeatmapRows(rows, unitFilter)
  }, [unitFilter, weekData])

  const activeUnitId =
    unitFilter !== 'todas' ? unitFilter : selection.unitId

  function handleDateChange(dateKey: string) {
    if (heatmapDays.some((day) => day.key === dateKey)) {
      onSelectionChange({ ...selection, dateKey })
      return
    }
    onGoToWeekContainingDate(dateKey)
  }

  return (
    <div className="flex shrink-0 flex-col gap-4">
      <PrefeituraAgendasHeatmap
        weekStart={weekStart}
        weekEnd={weekEnd}
        dayKeys={dayKeys}
        unitFilter={unitFilter}
        unitFilterOptions={catalog?.unitFilterOptions ?? [{ value: 'todas', label: 'Todas as unidades' }]}
        heatmapRows={heatmapRows}
        selected={selection}
        onUnitFilterChange={onUnitFilterChange}
        onSelectCell={onSelectionChange}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onGoToToday={onGoToTodayWeek}
        showTodayButton={!isViewingCurrentWeek}
        todayKey={todayKey}
      />

      {activeUnitId ? (
        <PrefeituraAgendasDaySchedule
          unitId={activeUnitId}
          dateKey={selection.dateKey}
          maxDate={new Date()}
          appointments={dayData?.appointments ?? []}
          breakdown={dayData?.breakdown}
          regionOptions={catalog?.regionOptions ?? []}
          findUnit={findUnit}
          getUnitOptionsForRegion={getUnitOptionsForRegion}
          onUnitChange={(unitId) => {
            onSelectionChange({ ...selection, unitId })
            if (unitFilter !== 'todas') onUnitFilterChange(unitId)
          }}
          onDateChange={handleDateChange}
        />
      ) : null}
    </div>
  )
}
