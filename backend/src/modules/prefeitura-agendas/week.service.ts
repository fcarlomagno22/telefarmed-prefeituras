import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import {
  buildAttendanceByUnit,
  buildHeatmapRows,
  buildHighlights,
  buildWeeklySummary,
} from './formatters.js'
import { fetchAgendaRowsForPeriod } from './query.service.js'
import type { PrefeituraAgendaWeekDto } from './types.js'

function enumerateDayKeys(weekStart: string, weekEnd: string): string[] {
  const keys: string[] = []
  const cursor = new Date(`${weekStart}T12:00:00`)
  const end = new Date(`${weekEnd}T12:00:00`)

  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

export async function getPrefeituraAgendaWeek(
  entidadeId: string,
  params: { weekStart: string; weekEnd: string; unidadeUbtId?: string },
): Promise<PrefeituraAgendaWeekDto> {
  const allUnits = await listRedeUnits(entidadeId)
  const visibleUnits =
    params.unidadeUbtId && params.unidadeUbtId !== 'todas'
      ? allUnits.filter((unit) => unit.id === params.unidadeUbtId)
      : allUnits

  const unitIds = visibleUnits.map((unit) => unit.id)
  const dayKeys = enumerateDayKeys(params.weekStart, params.weekEnd)

  const rows = await fetchAgendaRowsForPeriod(
    entidadeId,
    params.weekStart,
    params.weekEnd,
    unitIds.length > 0 ? unitIds : undefined,
  )

  const heatmapRows = buildHeatmapRows(visibleUnits, dayKeys, rows)
  const weeklySummary = buildWeeklySummary(heatmapRows)

  return {
    weekStart: params.weekStart,
    weekEnd: params.weekEnd,
    heatmapRows,
    weeklySummary,
    attendanceByUnit: buildAttendanceByUnit(heatmapRows),
    highlights: buildHighlights(heatmapRows, dayKeys),
  }
}
