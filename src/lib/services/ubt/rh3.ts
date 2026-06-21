import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/rh3'
import { mockDelay } from '../../mockServices/delay'

const useApi = isBackendApiEnabled()

export type {
  Rh3MtSpecialtyCatalogItem,
  Rh3MtSpecialtyCatalogResponse,
  Rh3ScheduleAvailabilityResponse,
  Rh3ScheduleSlot,
  ScheduleRh3AppointmentPayload,
  ScheduleRh3AppointmentResult,
  CreateRh3ImmediateConsultationPayload,
  CreateRh3ImmediateConsultationResult,
} from '../../api/ubt/rh3'

export const UbtRh3ApiError = useApi ? api.UbtRh3ApiError : Error

export function isUbtRh3ApiError(error: unknown): error is api.UbtRh3ApiError {
  return useApi && error instanceof api.UbtRh3ApiError
}

const mockRh3Specialties: api.Rh3MtSpecialtyCatalogItem[] = [
  {
    id: 'esp-cardio',
    name: 'Cardiologia',
    availableSlots: 3,
    available: true,
    origemAtendimento: 'mt',
    rh3EspecialidadId: 101,
  },
  {
    id: 'esp-clinica-geral',
    name: 'Clínica Geral',
    availableSlots: 5,
    available: true,
    origemAtendimento: 'mt',
    rh3EspecialidadId: 102,
  },
]

export async function fetchRh3MtSpecialties(accessToken: string, date?: string) {
  if (useApi) return api.apiFetchRh3MtSpecialties(accessToken, date)
  void accessToken
  return mockDelay({
    date: date ?? new Date().toISOString().slice(0, 10),
    specialties: mockRh3Specialties,
  })
}

export async function fetchRh3ScheduleSpecialties(accessToken: string) {
  if (useApi) return api.apiFetchRh3ScheduleSpecialties(accessToken)
  void accessToken
  return mockDelay({
    specialties: mockRh3Specialties.map((item) => ({
      ...item,
      available: true,
      availableSlots: 0,
    })),
  })
}

export async function fetchRh3ScheduleAvailability(
  accessToken: string,
  rh3EspecialidadId: number,
  params?: { date?: string; date_from?: string; language?: string },
) {
  if (useApi) return api.apiFetchRh3ScheduleAvailability(accessToken, rh3EspecialidadId, params)
  void accessToken

  const baseDate = params?.date ?? params?.date_from ?? new Date().toISOString().slice(0, 10)
  return mockDelay({
    appointments: [
      {
        idTurno: 9001,
        date: baseDate,
        hour: '09:00',
        length: 30,
        professionalId: 501,
        professionalName: 'Terceirizado Demo, Dr.',
        specialtyId: rh3EspecialidadId,
        specialtyName: 'Demo',
      },
      {
        idTurno: 9002,
        date: baseDate,
        hour: '10:30',
        length: 30,
        professionalId: 502,
        professionalName: 'Terceirizada Demo, Dra.',
        specialtyId: rh3EspecialidadId,
        specialtyName: 'Demo',
      },
    ],
    timestamp: new Date().toISOString(),
  })
}

export async function scheduleRh3Appointment(
  accessToken: string,
  payload: api.ScheduleRh3AppointmentPayload,
) {
  if (useApi) return api.apiScheduleRh3Appointment(accessToken, payload)
  void accessToken
  return mockDelay({
    appointment: {
      idTurno: payload.idTurno,
      idInvitacion: 7001,
      deeplinkPaciente: 'https://example.com/rh3/paciente',
      rh3PacienteId: 3001,
      origemAtendimento: 'mt' as const,
      especialidadeId: payload.especialidadeId,
      rh3EspecialidadId: payload.rh3EspecialidadId,
      data: payload.data,
      hora: payload.hora,
      pacienteId: payload.pacienteId,
      agendaConsultaId: 'agenda-mock-rh3-scheduled',
      consultaId: 'consulta-mock-rh3-scheduled',
      codigoAtendimento: 'mockRh3ScheduledConsulta01',
      appointment: {
        id: 'agenda-mock-rh3-scheduled',
        time: payload.hora.slice(0, 5),
        patientName: payload.paciente.fullName,
        patientCpf: payload.paciente.cpf,
        patientPhone: payload.paciente.phone,
        serviceType: 'Teleconsulta terceirizada',
        specialtyId: payload.especialidadeId,
        status: 'agendado',
        pacienteId: payload.pacienteId,
      },
    },
  })
}

export async function createRh3ImmediateConsultation(
  accessToken: string,
  payload: api.CreateRh3ImmediateConsultationPayload,
) {
  if (useApi) return api.apiCreateRh3ImmediateConsultation(accessToken, payload)
  void accessToken
  return mockDelay({
    consultation: {
      idInvitacion: 8001,
      deeplinkPaciente: 'https://example.com/rh3/paciente-imediato',
      rh3PacienteId: 3001,
      origemAtendimento: 'mt' as const,
      especialidadeId: payload.especialidadeId,
      rh3EspecialidadId: payload.rh3EspecialidadId,
      specialtyName: payload.specialtyName,
      pacienteId: payload.pacienteId,
      agendaConsultaId: 'agenda-mock-rh3-immediate',
      consultaId: 'consulta-mock-rh3-immediate',
      codigoAtendimento: 'mockRh3ImmediateConsult01',
      appointment: {
        id: 'agenda-mock-rh3-immediate',
        time: '09:00',
        patientName: payload.paciente.fullName,
        patientCpf: payload.paciente.cpf,
        patientPhone: payload.paciente.phone,
        serviceType: payload.specialtyName,
        specialtyId: payload.especialidadeId,
        status: 'aguardando',
        pacienteId: payload.pacienteId,
      },
    },
  })
}

export async function releaseRh3Elegibilidad(accessToken: string, cpf: string) {
  if (useApi) return api.apiReleaseRh3Elegibilidad(accessToken, cpf)
  void accessToken
  void cpf
  return mockDelay(undefined)
}
