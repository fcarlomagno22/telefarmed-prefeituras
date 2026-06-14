import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import { resolvePacienteFotoPublicUrl } from '../../lib/pacienteFoto.js'
import { climateHours, formatHoraDisplay } from './slot-utils.js'
import type {
  AgendaConsultaViewRow,
  AgendaDaySummaryDto,
  AgendaOperationalClimateDto,
  DayAppointmentDto,
  DoctorShiftDto,
  ScheduleDoctorDto,
} from './types.js'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PACIENTE_FOTO_STORAGE_PREFIX = 'sb://'

function rawPatientAvatarForApi(fotoUrl: string | null | undefined): string | undefined {
  const trimmed = fotoUrl?.trim()
  if (!trimmed || trimmed.startsWith(PACIENTE_FOTO_STORAGE_PREFIX)) return undefined
  return trimmed
}

export function formatAgendaConsultaRow(row: AgendaConsultaViewRow): DayAppointmentDto {
  const phone = row.telefone_contato?.trim() || row.paciente_telefone || ''
  return {
    id: row.id,
    time: formatHoraDisplay(String(row.hora)),
    patientName: row.paciente_nome,
    patientCpf: formatCpfDisplay(String(row.paciente_cpf)),
    patientPhone: phone,
    serviceType: row.especialidade_nome,
    specialtyId: row.especialidade_id,
    status: mapStatusToApi(row.status),
    pacienteId: row.paciente_id,
    patientAvatarUrl: rawPatientAvatarForApi(row.paciente_foto_url),
    profissionalId: row.profissional_id,
    especialidadeId: row.especialidade_id,
    escalaSlotId: row.escala_slot_id,
  }
}

export async function formatAgendaConsultaRows(
  rows: AgendaConsultaViewRow[],
): Promise<DayAppointmentDto[]> {
  const uniqueFotoRefs = [
    ...new Set(
      rows
        .map((row) => row.paciente_foto_url?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ]

  const resolvedByRef = new Map<string, string | undefined>()
  await Promise.all(
    uniqueFotoRefs.map(async (ref) => {
      resolvedByRef.set(ref, await resolvePacienteFotoPublicUrl(ref))
    }),
  )

  return rows.map((row) => {
    const appointment = formatAgendaConsultaRow(row)
    const rawRef = row.paciente_foto_url?.trim()
    if (!rawRef) return appointment

    const resolved = resolvedByRef.get(rawRef)
    if (resolved) {
      appointment.patientAvatarUrl = resolved
    }

    return appointment
  })
}

export function formatWeekdayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  const weekday = WEEKDAY_LABELS[date.getDay()] ?? '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${weekday}, ${day}/${month}`
}

export function mapStatusToApi(status: string): DayAppointmentDto['status'] {
  if (status === 'cancelado') return 'faltou'
  if (
    status === 'agendado' ||
    status === 'aguardando' ||
    status === 'em_atendimento' ||
    status === 'realizado' ||
    status === 'faltou'
  ) {
    return status
  }
  return 'agendado'
}

export function buildAgendaDaySummary(
  appointments: DayAppointmentDto[],
): AgendaDaySummaryDto {
  const completed = appointments.filter((item) => item.status === 'realizado').length
  const inProgress = appointments.filter((item) => item.status === 'em_atendimento').length
  const waiting = appointments.filter((item) => item.status === 'aguardando').length
  const scheduled = appointments.filter((item) => item.status === 'agendado').length
  const noShows = appointments.filter((item) => item.status === 'faltou').length
  const total = appointments.length
  const attendanceRate =
    total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0

  return {
    total,
    completed,
    inProgress,
    waiting,
    scheduled,
    noShows,
    attendanceRate,
  }
}

export function buildAgendaOperationalClimate(
  appointments: DayAppointmentDto[],
): AgendaOperationalClimateDto {
  const counts = new Map<string, number>()

  for (const appointment of appointments) {
    const hour = `${appointment.time.split(':')[0]}h`
    counts.set(hour, (counts.get(hour) ?? 0) + 1)
  }

  const hours = climateHours()
  const slots = hours.map((hour) => ({
    hour,
    count: counts.get(hour) ?? 0,
    isPeak: false,
  }))

  const maxCount = Math.max(...slots.map((slot) => slot.count), 0)

  return {
    hourlySlots: slots.map((slot) => ({
      ...slot,
      isPeak: slot.count > 0 && slot.count === maxCount,
    })),
  }
}

export function formatScheduleDoctor(input: {
  id: string
  nome: string
  specialtyId: string
  specialtyName: string
}): ScheduleDoctorDto {
  return {
    id: input.id,
    name: input.nome,
    specialtyId: input.specialtyId,
    specialtyName: input.specialtyName,
    avatarUrl: '',
    crm: '',
    rating: 0,
    reviewCount: 0,
  }
}

export function formatDoctorShift(input: {
  doctorId: string
  doctorName: string
  specialtyName: string
  horaInicio: string
  horaFim: string
  enteredAt?: string | null
  endedAt?: string | null
}): DoctorShiftDto {
  const startTime = input.enteredAt
    ? formatHoraDisplay(input.enteredAt.slice(11, 16))
    : formatHoraDisplay(input.horaInicio)
  const endTime = input.endedAt
    ? formatHoraDisplay(input.endedAt.slice(11, 16))
    : formatHoraDisplay(input.horaFim)

  return {
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    specialtyName: input.specialtyName,
    startTime,
    endTime,
  }
}
