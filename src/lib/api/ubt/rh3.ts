import { ApiError, apiFetch } from '../http'

export class UbtRh3ApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtRh3ApiError'
  }
}

function mapError(error: unknown): UbtRh3ApiError {
  if (error instanceof ApiError) {
    return new UbtRh3ApiError(error.message, error.status, error.code)
  }
  return new UbtRh3ApiError('Não foi possível completar a requisição RH3.', 0)
}

export type Rh3ScheduleSlot = {
  idTurno: number
  date: string
  hour: string
  length: number
  professionalId: number | null
  professionalName: string | null
  specialtyId: number
  specialtyName: string | null
}

export type Rh3ScheduleAvailabilityResponse = {
  appointments: Rh3ScheduleSlot[]
  timestamp: string
}

export type Rh3MtSpecialtyCatalogItem = {
  id: string
  name: string
  availableSlots: number
  available: boolean
  origemAtendimento: 'mt'
  rh3EspecialidadId: number
}

export type Rh3MtSpecialtyCatalogResponse = {
  date?: string
  specialties: Rh3MtSpecialtyCatalogItem[]
}

export type ScheduleRh3AppointmentPayload = {
  pacienteId: string
  especialidadeId: string
  rh3EspecialidadId: number
  idTurno: number
  data: string
  hora: string
  professionalName?: string
  specialtyName?: string
  paciente: {
    cpf: string
    fullName: string
    email: string
    phone: string
    birthDate: string
    gender: string
  }
}

export type ScheduleRh3AppointmentResult = {
  appointment: {
    idTurno: number
    idInvitacion: number
    deeplinkPaciente?: string
    deeplinkProfesional?: string
    rh3PacienteId: number
    origemAtendimento: 'mt'
    especialidadeId: string
    rh3EspecialidadId: number
    data: string
    hora: string
    pacienteId: string
    agendaConsultaId: string
    consultaId: string
    codigoAtendimento: string
    appointment: {
      id: string
      time: string
      patientName: string
      patientCpf: string
      patientPhone: string
      serviceType: string
      specialtyId?: string
      status: 'agendado' | 'aguardando' | 'em_atendimento' | 'realizado' | 'faltou'
      pacienteId?: string
      patientAvatarUrl?: string
      profissionalId?: string | null
      especialidadeId?: string
      escalaSlotId?: string | null
    }
  }
}

export type CreateRh3ImmediateConsultationPayload = {
  pacienteId: string
  especialidadeId: string
  rh3EspecialidadId: number
  specialtyName: string
  paciente: ScheduleRh3AppointmentPayload['paciente']
}

export type CreateRh3ImmediateConsultationResult = {
  consultation: {
    idInvitacion: number
    deeplinkPaciente: string
    rh3PacienteId: number
    origemAtendimento: 'mt'
    especialidadeId: string
    rh3EspecialidadId: number
    specialtyName: string
    pacienteId: string
    agendaConsultaId: string
    consultaId: string
    codigoAtendimento: string
    appointment: ScheduleRh3AppointmentResult['appointment']['appointment']
  }
}

export async function apiFetchRh3MtSpecialties(accessToken: string, date?: string) {
  try {
    const query = new URLSearchParams()
    if (date) query.set('date', date)
    query.set('scope', 'day')
    const suffix = `?${query.toString()}`
    return await apiFetch<Rh3MtSpecialtyCatalogResponse>(`/ubt/rh3/especialidades${suffix}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchRh3ScheduleSpecialties(accessToken: string) {
  try {
    return await apiFetch<Rh3MtSpecialtyCatalogResponse>(
      '/ubt/rh3/especialidades?scope=schedule',
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchRh3ScheduleAvailability(
  accessToken: string,
  rh3EspecialidadId: number,
  params?: { date?: string; date_from?: string; language?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.date) query.set('date', params.date)
    if (params?.date_from) query.set('date_from', params.date_from)
    if (params?.language) query.set('language', params.language)
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return await apiFetch<Rh3ScheduleAvailabilityResponse>(
      `/ubt/rh3/schedule/availability/${encodeURIComponent(String(rh3EspecialidadId))}${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiScheduleRh3Appointment(
  accessToken: string,
  payload: ScheduleRh3AppointmentPayload,
) {
  try {
    return await apiFetch<ScheduleRh3AppointmentResult>('/ubt/rh3/schedule/appointments', {
      accessToken,
      method: 'POST',
      json: payload,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreateRh3ImmediateConsultation(
  accessToken: string,
  payload: CreateRh3ImmediateConsultationPayload,
) {
  try {
    return await apiFetch<CreateRh3ImmediateConsultationResult>(
      '/ubt/rh3/immediate/consultations',
      {
        accessToken,
        method: 'POST',
        json: payload,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiReleaseRh3Elegibilidad(accessToken: string, cpf: string) {
  try {
    const document = cpf.replace(/\D/g, '')
    await apiFetch<void>(`/ubt/rh3/elegibilidad/${encodeURIComponent(document)}`, {
      accessToken,
      method: 'DELETE',
    })
  } catch (error) {
    throw mapError(error)
  }
}
