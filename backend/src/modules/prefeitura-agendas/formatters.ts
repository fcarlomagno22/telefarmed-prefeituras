import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type { DayAppointmentDto } from '../ubt-agenda/types.js'
import { formatWeekdayLabel } from '../ubt-agenda/formatters.js'
import type {
  AgendaAggregateRow,
  AttendanceRowDto,
  HeatmapCellDto,
  HeatmapUnitRowDto,
  HighlightItemDto,
  PrefeituraAgendaCatalogDto,
  PrefeituraAgendaUnitDto,
} from './types.js'

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

const ATTENDED_STATUSES = new Set(['realizado', 'em_atendimento', 'aguardando'])

function isAttended(status: string): boolean {
  return ATTENDED_STATUSES.has(status)
}

function isNoShow(status: string): boolean {
  return status === 'faltou'
}

function emptyCell(): HeatmapCellDto {
  return { attendancePercent: 0, attended: 0, noShows: 0, total: 0 }
}

function buildCellFromRows(rows: AgendaAggregateRow[]): HeatmapCellDto {
  let attended = 0
  let noShows = 0

  for (const row of rows) {
    if (isAttended(row.status)) attended += 1
    else if (isNoShow(row.status)) noShows += 1
  }

  const total = rows.length
  const resolved = attended + noShows
  const attendancePercent = resolved > 0 ? Math.round((attended / resolved) * 100) : 0

  return { attendancePercent, attended, noShows, total }
}

export function buildCatalogFromUnits(units: RedeUnitApi[]): PrefeituraAgendaCatalogDto {
  const agendaUnits: PrefeituraAgendaUnitDto[] = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    regionKey: unit.regionKey,
    regionLabel: unit.region,
  }))

  const regions = new Map<string, string>()
  for (const unit of agendaUnits) {
    if (unit.regionKey) regions.set(unit.regionKey, unit.regionLabel)
  }

  const regionOptions = [...regions.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
    .map(([value, label]) => ({ value, label: `RA ${label}` }))

  return {
    units: agendaUnits,
    regionOptions,
    unitFilterOptions: [
      { value: 'todas', label: 'Todas as unidades' },
      ...agendaUnits.map((unit) => ({ value: unit.id, label: unit.name })),
    ],
  }
}

export function buildHeatmapRows(
  units: RedeUnitApi[],
  dayKeys: string[],
  rows: AgendaAggregateRow[],
): HeatmapUnitRowDto[] {
  const byUnitDay = new Map<string, AgendaAggregateRow[]>()

  for (const row of rows) {
    const key = `${row.unidade_ubt_id}:${row.data}`
    const bucket = byUnitDay.get(key) ?? []
    bucket.push(row)
    byUnitDay.set(key, bucket)
  }

  return units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    cells: dayKeys.map((dayKey) => {
      const cellRows = byUnitDay.get(`${unit.id}:${dayKey}`) ?? []
      return cellRows.length > 0 ? buildCellFromRows(cellRows) : emptyCell()
    }),
  }))
}

export function buildWeeklySummary(heatmapRows: HeatmapUnitRowDto[]) {
  const totals = heatmapRows.reduce(
    (acc, row) => {
      for (const cell of row.cells) {
        acc.totalAppointments += cell.total
        acc.attended += cell.attended
        acc.noShows += cell.noShows
      }
      return acc
    },
    { totalAppointments: 0, attended: 0, noShows: 0 },
  )

  const resolved = totals.attended + totals.noShows
  const attendanceRatePercent =
    resolved > 0 ? Math.round((totals.attended / resolved) * 100) : 0

  return { ...totals, attendanceRatePercent }
}

export function buildAttendanceByUnit(heatmapRows: HeatmapUnitRowDto[]): AttendanceRowDto[] {
  return heatmapRows
    .map((row) => {
      const attended = row.cells.reduce((sum, cell) => sum + cell.attended, 0)
      const absences = row.cells.reduce((sum, cell) => sum + cell.noShows, 0)
      const resolved = attended + absences
      const absenceRate = resolved > 0 ? Math.round((absences / resolved) * 100) : 0

      return {
        id: row.id,
        label: row.name,
        attended,
        absences,
        absenceRate,
      }
    })
    .sort((a, b) => b.attended - a.attended)
}

function weekdayShort(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return WEEKDAY_SHORT[date.getDay()] ?? '—'
}

type CellHighlight = {
  unitId: string
  unitName: string
  dateKey: string
  percent: number
}

export function buildHighlights(
  heatmapRows: HeatmapUnitRowDto[],
  dayKeys: string[],
): HighlightItemDto[] {
  const cellItems: CellHighlight[] = []

  for (const row of heatmapRows) {
    row.cells.forEach((cell, index) => {
      const resolved = cell.attended + cell.noShows
      if (resolved <= 0) return
      cellItems.push({
        unitId: row.id,
        unitName: row.name,
        dateKey: dayKeys[index] ?? '',
        percent: cell.attendancePercent,
      })
    })
  }

  const unitTotals = buildAttendanceByUnit(heatmapRows)
  const highlights: HighlightItemDto[] = []

  if (cellItems.length > 0) {
    const lowest = cellItems.reduce((min, item) => (item.percent < min.percent ? item : min))
    const highest = cellItems.reduce((max, item) => (item.percent > max.percent ? item : max))

    highlights.push({
      id: 'low-attendance',
      title: 'Menor Comparecimento',
      subtitle: `${lowest.unitName} (${weekdayShort(lowest.dateKey)}) — ${lowest.percent}% na semana`,
      tone: 'red',
    })

    highlights.push({
      id: 'high-attendance',
      title: 'Maior Comparecimento',
      subtitle: `${highest.unitName} (${weekdayShort(highest.dateKey)}) — ${highest.percent}% na semana`,
      tone: 'green',
    })
  }

  const withAbsences = unitTotals.filter((item) => item.attended + item.absences > 0)
  if (withAbsences.length > 0) {
    const highestAbsence = withAbsences.reduce((max, item) =>
      item.absenceRate > max.absenceRate ? item : max,
    )
    highlights.push({
      id: 'absences',
      title: 'Maior Taxa de Faltas',
      subtitle: `${highestAbsence.label} (${highestAbsence.absenceRate}% de faltas)`,
      tone: 'amber',
    })

    const bestUnit = withAbsences.reduce((best, item) => {
      const resolved = item.attended + item.absences
      const rate = resolved > 0 ? Math.round((item.attended / resolved) * 100) : 0
      const bestResolved = best.attended + best.absences
      const bestRate = bestResolved > 0 ? Math.round((best.attended / bestResolved) * 100) : 0
      return rate > bestRate ? item : best
    })

    const bestResolved = bestUnit.attended + bestUnit.absences
    const bestRate =
      bestResolved > 0 ? Math.round((bestUnit.attended / bestResolved) * 100) : 0

    highlights.push({
      id: 'performance',
      title: 'Melhor Desempenho',
      subtitle: `${bestUnit.label} (${bestRate}% comparecimento)`,
      tone: 'blue',
    })
  }

  return highlights
}

export function buildDayBreakdown(rows: AgendaAggregateRow[]) {
  let attended = 0
  let noShows = 0

  for (const row of rows) {
    if (isAttended(row.status)) attended += 1
    else if (isNoShow(row.status)) noShows += 1
  }

  const resolved = attended + noShows
  const attendancePercent = resolved > 0 ? Math.round((attended / resolved) * 100) : 0

  return { attended, noShows, attendancePercent }
}

export function buildDayBreakdownFromAppointments(appointments: DayAppointmentDto[]) {
  let attended = 0
  let noShows = 0

  for (const appointment of appointments) {
    if (isAttended(appointment.status)) attended += 1
    else if (isNoShow(appointment.status)) noShows += 1
  }

  const resolved = attended + noShows
  const attendancePercent = resolved > 0 ? Math.round((attended / resolved) * 100) : 0

  return { attended, noShows, attendancePercent }
}

export function formatFutureDayLabel(isoDate: string): string {
  return formatWeekdayLabel(isoDate)
}

export function formatPeakHourLabel(hour: number): string {
  const nextHour = hour + 1
  return `${String(hour).padStart(2, '0')}h – ${String(nextHour).padStart(2, '0')}h`
}

export function parseHourFromTime(hora: string): number {
  const match = /^(\d{2})/.exec(hora)
  return match ? Number(match[1]) : 0
}
