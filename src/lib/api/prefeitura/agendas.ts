import type { AppointmentStatus, DayAppointment } from '../../../data/agendaMock'
import type {
  AttendanceRow,
  FutureAppointmentsSummary,
  HeatmapUnitRow,
  HighlightItem,
  PrefeituraAgendasFuturePeriodId,
} from '../../../data/prefeituraAgendasMock'
import { ApiError, apiFetch } from '../http'

export class PrefeituraAgendasApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraAgendasApiError'
  }
}

function mapError(error: unknown): PrefeituraAgendasApiError {
  if (error instanceof ApiError) {
    return new PrefeituraAgendasApiError(error.message, error.status, error.code)
  }
  return new PrefeituraAgendasApiError('Não foi possível completar a requisição.', 0)
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

export async function apiFetchPrefeituraAgendaCatalog(
  accessToken: string,
): Promise<PrefeituraAgendaCatalogApi> {
  try {
    return await apiFetch<PrefeituraAgendaCatalogApi>('/prefeitura/agendas/catalog', {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraAgendaWeek(
  accessToken: string,
  params: { weekStart: string; weekEnd: string; unidadeUbtId?: string },
): Promise<PrefeituraAgendaWeekApi> {
  try {
    const query = new URLSearchParams({
      weekStart: params.weekStart,
      weekEnd: params.weekEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)

    return await apiFetch<PrefeituraAgendaWeekApi>(
      `/prefeitura/agendas/semana?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraAgendaDay(
  accessToken: string,
  params: { date: string; unidadeUbtId: string },
): Promise<PrefeituraAgendaDayApi> {
  try {
    const query = new URLSearchParams({
      date: params.date,
      unidadeUbtId: params.unidadeUbtId,
    })

    return await apiFetch<PrefeituraAgendaDayApi>(
      `/prefeitura/agendas/dia?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraAgendaFuture(
  accessToken: string,
  params: { period: PrefeituraAgendasFuturePeriodId; unidadeUbtId?: string },
): Promise<PrefeituraAgendaFutureApi> {
  try {
    const query = new URLSearchParams({ period: params.period })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)

    return await apiFetch<PrefeituraAgendaFutureApi>(
      `/prefeitura/agendas/futuro?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function mapDayAppointmentStatus(status: DayAppointment['status']): AppointmentStatus {
  return status
}
