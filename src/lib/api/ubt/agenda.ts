import type { AgendaDayData, AgendaHistoryDay, DayAppointment } from '../../../data/agendaMock'
import type { ScheduleDoctor, ScheduleTimeSlot } from '../../../data/scheduleDoctorsMock'
import { ApiError, apiFetch } from '../http'

export class UbtAgendaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtAgendaApiError'
  }
}

function mapError(error: unknown): UbtAgendaApiError {
  if (error instanceof ApiError) {
    return new UbtAgendaApiError(error.message, error.status, error.code)
  }
  return new UbtAgendaApiError('Não foi possível completar a requisição.', 0)
}

export type DayAppointmentApi = DayAppointment & {
  pacienteId?: string
  profissionalId?: string | null
  especialidadeId?: string
  escalaSlotId?: string | null
}

export type UbtAgendaDoctorShiftApi = {
  doctorId: string
  doctorName: string
  specialtyName: string
  startTime: string
  endTime: string
}

export type UbtAgendaSpecialtyAvailability = {
  id: string
  name: string
  availableSlots: number
}

export async function apiFetchUbtAgendaDay(accessToken: string, date: string) {
  try {
    return await apiFetch<AgendaDayData>(`/ubt/agenda/dia?date=${encodeURIComponent(date)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaWeek(accessToken: string, from: string, to: string) {
  try {
    return await apiFetch<Record<string, AgendaDayData>>(
      `/ubt/agenda/semana?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaMonthIndicators(
  accessToken: string,
  year: number,
  month: number,
) {
  try {
    const response = await apiFetch<{ dates: string[] }>(
      `/ubt/agenda/indicadores-mes?year=${year}&month=${month}`,
      { accessToken },
    )
    return new Set(response.dates)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaHistory(
  accessToken: string,
  date: string,
  count = 3,
) {
  try {
    const response = await apiFetch<{ history: AgendaHistoryDay[] }>(
      `/ubt/agenda/historico?date=${encodeURIComponent(date)}&count=${count}`,
      { accessToken },
    )
    return response.history
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaMedicos(
  accessToken: string,
  params?: { specialtyId?: string; date?: string },
) {
  try {
    const search = new URLSearchParams()
    if (params?.specialtyId) search.set('specialtyId', params.specialtyId)
    if (params?.date) search.set('date', params.date)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    const response = await apiFetch<{ doctors: ScheduleDoctor[] }>(
      `/ubt/agenda/medicos${suffix}`,
      { accessToken },
    )
    return response.doctors
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaDoctorSlots(
  accessToken: string,
  doctorId: string,
  date: string,
) {
  try {
    const response = await apiFetch<{ slots: ScheduleTimeSlot[] }>(
      `/ubt/agenda/medicos/${doctorId}/slots?date=${encodeURIComponent(date)}`,
      { accessToken },
    )
    return response.slots
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaDoctorOverview(
  accessToken: string,
  doctorId: string,
  from: string,
  days = 31,
) {
  try {
    const response = await apiFetch<{
      overview: Array<{ date: string; worksThisDay: boolean; availableSlots: number }>
    }>(
      `/ubt/agenda/medicos/${doctorId}/overview?from=${encodeURIComponent(from)}&days=${days}`,
      { accessToken },
    )
    return response.overview
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaSpecialtySlotCount(
  accessToken: string,
  specialtyId: string,
  date: string,
) {
  try {
    const response = await apiFetch<{ count: number }>(
      `/ubt/agenda/especialidades/${encodeURIComponent(specialtyId)}/slots-count?date=${encodeURIComponent(date)}`,
      { accessToken },
    )
    return response.count
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaSpecialtyAvailability(
  accessToken: string,
  date: string,
) {
  try {
    const response = await apiFetch<{ specialties: UbtAgendaSpecialtyAvailability[] }>(
      `/ubt/agenda/especialidades/disponibilidade?date=${encodeURIComponent(date)}`,
      { accessToken },
    )
    return response.specialties
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtAgendaDoctorShifts(accessToken: string, date: string) {
  try {
    const response = await apiFetch<{ shifts: UbtAgendaDoctorShiftApi[] }>(
      `/ubt/agenda/plantoes?date=${encodeURIComponent(date)}`,
      { accessToken },
    )
    return response.shifts
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreateUbtAgendaConsulta(
  accessToken: string,
  payload: {
    pacienteId: string
    profissionalId: string
    especialidadeId: string
    data: string
    hora: string
    escalaSlotId?: string
    telefoneContato?: string
    observacoes?: string
    tipo?: 'consulta' | 'retorno'
  },
) {
  try {
    const response = await apiFetch<{ appointment: DayAppointmentApi }>(
      '/ubt/agenda/consultas',
      { accessToken, method: 'POST', json: payload },
    )
    return response.appointment
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpdateUbtAgendaConsulta(
  accessToken: string,
  consultaId: string,
  payload: {
    profissionalId?: string
    especialidadeId?: string
    data?: string
    hora?: string
    telefoneContato?: string
    observacoes?: string
    status?: DayAppointment['status']
  },
) {
  try {
    const response = await apiFetch<{ appointment: DayAppointmentApi }>(
      `/ubt/agenda/consultas/${consultaId}`,
      { accessToken, method: 'PATCH', json: payload },
    )
    return response.appointment
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCancelUbtAgendaConsulta(accessToken: string, consultaId: string) {
  try {
    await apiFetch<void>(`/ubt/agenda/consultas/${consultaId}/cancelar`, {
      accessToken,
      method: 'POST',
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiConfirmUbtAgendaRecepcao(accessToken: string, consultaId: string) {
  try {
    const response = await apiFetch<{ appointment: DayAppointmentApi }>(
      `/ubt/agenda/consultas/${consultaId}/recepcao`,
      { accessToken, method: 'POST' },
    )
    return response.appointment
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiMarkUbtAgendaFalta(accessToken: string, consultaId: string) {
  try {
    const response = await apiFetch<{ appointment: DayAppointmentApi }>(
      `/ubt/agenda/consultas/${consultaId}/falta`,
      { accessToken, method: 'POST' },
    )
    return response.appointment
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreateUbtAgendaWalkIn(
  accessToken: string,
  payload: {
    pacienteId: string
    especialidadeId: string
    profissionalId: string
    hora: string
    telefoneContato?: string
    observacoes?: string
  },
) {
  try {
    const response = await apiFetch<{ appointment: DayAppointmentApi }>(
      '/ubt/agenda/encaixe',
      { accessToken, method: 'POST', json: payload },
    )
    return response.appointment
  } catch (error) {
    throw mapError(error)
  }
}
