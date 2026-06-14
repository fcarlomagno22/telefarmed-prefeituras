import type { AppointmentStatus, DayAppointment } from '../../../data/agendaMock'
import type {
  AttendanceRow,
  FutureAppointmentsSummary,
  HeatmapUnitRow,
  HighlightItem,
  PrefeituraAgendasFuturePeriodId,
} from '../../../data/prefeituraAgendasMock'
import {
  prefeituraAgendasAttendanceByUbs,
  prefeituraAgendasFuture30Days,
  prefeituraAgendasFuture7Days,
  prefeituraAgendasHighlights,
  filterHeatmapRows,
} from '../../../data/prefeituraAgendasMock'
import {
  buildPrefeituraHeatmapRows,
  getDefaultAgendasWeek,
  getPrefeituraUnitDayAppointments,
  prefeituraAgendaRegionOptions,
  prefeituraAgendaUnits,
  prefeituraAgendasUnitFilterOptions,
} from '../../../data/prefeituraAgendasScheduleMock'
import { computeAttendanceBreakdown } from '../../../utils/prefeituraAgendasAttendance'
import { mockDelay } from '../delay'

export class PrefeituraAgendasApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraAgendasApiError'
    this.status = status
    this.code = code
  }
}

export type PrefeituraAgendaUnitApi = {
  id: string
  name: string
  regionKey: string
  regionLabel: string
}

export type PrefeituraAgendaCatalogApi = {
  units: PrefeituraAgendaUnitApi[]
  regionOptions: Array<{ value: string; label: string }>
  unitFilterOptions: Array<{ value: string; label: string }>
}

export type PrefeituraAgendaWeekApi = {
  weekStart: string
  weekEnd: string
  heatmapRows: HeatmapUnitRow[]
  weeklySummary: {
    totalAppointments: number
    attended: number
    attendanceRatePercent: number
    noShows: number
  }
  attendanceByUnit: AttendanceRow[]
  highlights: HighlightItem[]
}

export type PrefeituraAgendaDayApi = {
  date: string
  unitId: string
  appointments: DayAppointment[]
  breakdown: {
    attended: number
    noShows: number
    attendancePercent: number
  }
}

export type PrefeituraAgendaFutureApi = FutureAppointmentsSummary

export function isPrefeituraAgendasApiError(error: unknown): error is PrefeituraAgendasApiError {
  return error instanceof PrefeituraAgendasApiError
}

export async function fetchPrefeituraAgendaCatalog(_accessToken: string) {
  void _accessToken
  const catalog: PrefeituraAgendaCatalogApi = {
    units: prefeituraAgendaUnits.map((unit) => ({ ...unit })),
    regionOptions: prefeituraAgendaRegionOptions.map((item) => ({ ...item })),
    unitFilterOptions: prefeituraAgendasUnitFilterOptions.map((item) => ({ ...item })),
  }
  return mockDelay(catalog, 60)
}

function buildWeekSummary(rows: HeatmapUnitRow[]) {
  const totals = rows.reduce(
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
  const attendanceRatePercent =
    totals.totalAppointments > 0
      ? Math.round((totals.attended / totals.totalAppointments) * 100)
      : 0
  return { ...totals, attendanceRatePercent }
}

export async function fetchPrefeituraAgendaWeek(
  _accessToken: string,
  params: { weekStart: string; weekEnd: string; unidadeUbtId?: string },
) {
  void _accessToken
  const week =
    params.weekStart && params.weekEnd
      ? { start: params.weekStart, end: params.weekEnd, dayKeys: [] as string[] }
      : getDefaultAgendasWeek()

  const dayKeys =
    week.dayKeys.length > 0
      ? week.dayKeys
      : (() => {
          const keys: string[] = []
          const start = new Date(params.weekStart)
          for (let i = 0; i < 7; i += 1) {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            keys.push(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            )
          }
          return keys
        })()

  const heatmapRows = filterHeatmapRows(
    buildPrefeituraHeatmapRows(dayKeys),
    params.unidadeUbtId ?? 'todas',
  )
  const summary = buildWeekSummary(heatmapRows)

  const weekApi: PrefeituraAgendaWeekApi = {
    weekStart: params.weekStart || week.start,
    weekEnd: params.weekEnd || week.end,
    heatmapRows,
    weeklySummary: summary,
    attendanceByUnit: structuredClone(prefeituraAgendasAttendanceByUbs),
    highlights: structuredClone(prefeituraAgendasHighlights),
  }
  return mockDelay(weekApi, 70)
}

export async function fetchPrefeituraAgendaDay(
  _accessToken: string,
  params: { date: string; unidadeUbtId: string },
) {
  void _accessToken
  const appointments = getPrefeituraUnitDayAppointments(params.unidadeUbtId, params.date)
  const breakdown = computeAttendanceBreakdown(appointments)
  const day: PrefeituraAgendaDayApi = {
    date: params.date,
    unitId: params.unidadeUbtId,
    appointments,
    breakdown: {
      attended: breakdown.attended,
      noShows: breakdown.noShows,
      attendancePercent: breakdown.attendancePercent,
    },
  }
  return mockDelay(day, 60)
}

export async function fetchPrefeituraAgendaFuture(
  _accessToken: string,
  params: { period: PrefeituraAgendasFuturePeriodId; unidadeUbtId?: string },
) {
  void _accessToken
  const base = params.period === '30d' ? prefeituraAgendasFuture30Days : prefeituraAgendasFuture7Days
  const future = structuredClone(base)
  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    const unit = prefeituraAgendaUnits.find((item) => item.id === params.unidadeUbtId)
    if (unit) {
      future.topUnit = unit.name
      future.topUnitBookings = Math.round(future.total * 0.18)
    }
  }
  return mockDelay(future, 60)
}

export function mapDayAppointmentStatus(
  status: DayAppointment['status'],
): AppointmentStatus {
  return status
}
