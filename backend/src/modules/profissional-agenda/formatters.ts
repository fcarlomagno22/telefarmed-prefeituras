import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import {
  formatLocalTimestampAsIso,
  resolveTurnFromTime,
} from '../../lib/escalaDateTime.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import type {
  AgendaConsultaRow,
  ConsultaClinicaRow,
  ProfissionalAgendaConsultaApi,
  ProfissionalAgendaPlantaoApi,
  ProfissionalAgendaShiftStatsApi,
  SlotAgendaRow,
} from './types.js'

const TELEMEDICINE_LABEL = 'Telemedicina'

function mapModality(
  modalidade: string,
): { modality: 'tele' | 'presencial'; modalityLabel: string } {
  if (modalidade === 'presencial_ubt') {
    return { modality: 'presencial', modalityLabel: 'Presencial' }
  }
  if (modalidade === 'hibrido') {
    return { modality: 'tele', modalityLabel: 'Híbrido' }
  }
  return { modality: 'tele', modalityLabel: TELEMEDICINE_LABEL }
}

function formatTimeFromDb(time: string): string {
  const parts = String(time).split(':')
  return `${parts[0] ?? '00'}:${parts[1] ?? '00'}`
}

function mapAgendaStatusToQueueStatus(
  agendaStatus: string,
  consulta: ConsultaClinicaRow | null,
  inFila: boolean,
): ProfissionalAgendaConsultaApi['status'] {
  if (consulta?.status === 'em_andamento') return 'em_atendimento'
  if (consulta?.status === 'concluida') return 'finalizado'
  if (consulta?.status === 'cancelada' || consulta?.status === 'interrompida') {
    return 'desistiu'
  }

  if (consulta?.sala_espera_entrada_em) return 'chamado'

  // Agenda presa em atendimento/chamado sem fila ativa nem consulta clínica = estado órfão.
  if (
    !inFila &&
    (agendaStatus === 'em_atendimento' || agendaStatus === 'aguardando') &&
    consulta?.status !== 'em_andamento'
  ) {
    return 'desistiu'
  }

  switch (agendaStatus) {
    case 'realizado':
      return 'finalizado'
    case 'faltou':
      return 'nao_compareceu'
    case 'cancelado':
      return 'desistiu'
    case 'em_atendimento':
      return 'em_atendimento'
    default:
      return 'aguardando'
  }
}

export function computeStatsFromConsultas(
  consultas: ProfissionalAgendaConsultaApi[],
): ProfissionalAgendaShiftStatsApi {
  const previstos = consultas.length
  const naFila = consultas.filter(
    (item) => item.status === 'aguardando' || item.status === 'chamado',
  ).length
  const atendidos = consultas.filter((item) => item.status === 'finalizado').length

  const durations: number[] = []
  for (const item of consultas) {
    if (item.status !== 'finalizado') continue
    if (item.duracaoMinutos && item.duracaoMinutos > 0) {
      durations.push(item.duracaoMinutos)
    }
  }

  const tempoMedioMin =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0

  return { previstos, naFila, atendidos, tempoMedioMin }
}

export function formatPlantaoApi(
  plantaoId: string,
  slot: SlotAgendaRow,
  profissionalId: string,
  plantaoStatus: string,
  stats: ProfissionalAgendaShiftStatsApi,
): ProfissionalAgendaPlantaoApi {
  const timing = resolveTurnFromTime(slot.hora_inicio)
  const { modality, modalityLabel } = mapModality(slot.modalidade)
  const inicioEm = `${slot.data} ${slot.hora_inicio}`
  const fimEm = `${slot.data} ${slot.hora_fim}`
  const role =
    slot.profissional_titular_id && slot.profissional_titular_id === profissionalId
      ? 'titular'
      : 'reserva'

  const municipality =
    [slot.cidade?.trim(), slot.cidade_uf?.trim()].filter(Boolean).join(' - ') || '—'
  const specialty = String(slot.config_especialidades?.nome ?? '')

  return {
    shiftId: plantaoId,
    plantaoId,
    escalaSlotId: String(slot.id),
    dateKey: String(slot.data),
    municipality,
    ubtLabel: slot.unidade_nome?.trim() || TELEMEDICINE_LABEL,
    specialty,
    turnLabel: timing.turnLabel,
    startAt: formatLocalTimestampAsIso(inicioEm),
    endAt: formatLocalTimestampAsIso(fimEm),
    startTime: formatTimeFromDb(slot.hora_inicio),
    endTime: formatTimeFromDb(slot.hora_fim),
    role,
    modality,
    modalityLabel,
    plantaoStatus,
    stats,
  }
}

export function formatAgendaConsultaApi(
  row: AgendaConsultaRow,
  options: {
    shiftId: string
    plantaoId: string
    consultaClinica: ConsultaClinicaRow | null
    inFila: boolean
    filaChegadaEm: string | null
    filaChamadoEm: string | null
  },
): ProfissionalAgendaConsultaApi {
  const patient = row.pacientes
  const specialty = String(row.config_especialidades?.nome ?? '')
  const ubtName = String(row.unidades_ubt?.nome ?? '—')
  const scheduledTime = formatTimeFromDb(row.hora)
  const arrivedAt =
    options.filaChegadaEm ??
    options.consultaClinica?.iniciada_em ??
    formatLocalTimestampAsIso(`${row.data} ${row.hora}`)

  const status = mapAgendaStatusToQueueStatus(row.status, options.consultaClinica, options.inFila)

  return {
    id: options.consultaClinica?.id ?? row.id,
    agendaConsultaId: row.id,
    shiftId: options.shiftId,
    plantaoId: options.plantaoId,
    escalaSlotId: row.escala_slot_id ? String(row.escala_slot_id) : null,
    patientName: String(patient?.nome ?? 'Paciente'),
    patientAge: calcAgeFromBirthDate(patient?.data_nascimento),
    patientCpf: patient?.cpf ? formatCpfDisplay(String(patient.cpf)) : '—',
    specialty,
    serviceType: row.origem === 'espontaneo' ? 'Espontâneo' : 'Consulta agendada',
    triageReason: row.observacoes?.trim() || '—',
    ubtName,
    scheduledTime,
    origin: row.origem === 'espontaneo' ? 'espontaneo' : 'agendado',
    arrivedAt,
    status,
    recallCount: 0,
    calledAt: options.filaChamadoEm ?? options.consultaClinica?.sala_espera_entrada_em ?? undefined,
    attendanceId: options.consultaClinica?.codigo_atendimento ?? undefined,
    ...(options.consultaClinica?.duracao_minutos != null &&
    options.consultaClinica.duracao_minutos > 0
      ? { duracaoMinutos: options.consultaClinica.duracao_minutos }
      : {}),
  }
}

export function formatOperationalConsultaApi(
  row: {
    id: string
    codigo_atendimento: string
    agenda_consulta_id: string | null
    status: string
    triagem_resumo: string
    iniciada_em: string | null
    sala_espera_entrada_em: string | null
    paciente_nome: string
    paciente_cpf: string
    paciente_data_nascimento: string | null
    especialidade_nome: string
    unidade_nome: string
  },
  shiftId: string,
  plantaoId: string,
): ProfissionalAgendaConsultaApi {
  const inWaitingRoom = Boolean(row.sala_espera_entrada_em)
  let status: ProfissionalAgendaConsultaApi['status'] = 'aguardando'
  if (row.status === 'em_andamento') status = 'em_atendimento'
  else if (row.status === 'concluida') status = 'finalizado'
  else if (row.status === 'aguardando_medico') {
    status = inWaitingRoom ? 'chamado' : 'aguardando'
  }

  return {
    id: row.id,
    agendaConsultaId: row.agenda_consulta_id,
    shiftId,
    plantaoId,
    escalaSlotId: null,
    patientName: row.paciente_nome,
    patientAge: calcAgeFromBirthDate(row.paciente_data_nascimento),
    patientCpf: row.paciente_cpf ? formatCpfDisplay(row.paciente_cpf) : '—',
    specialty: row.especialidade_nome,
    serviceType: 'Teleconsulta',
    triageReason: row.triagem_resumo?.trim() || '—',
    ubtName: row.unidade_nome || 'Teleatendimento',
    origin: 'espontaneo',
    arrivedAt: row.iniciada_em ?? row.sala_espera_entrada_em ?? new Date().toISOString(),
    status,
    recallCount: 0,
    calledAt: row.sala_espera_entrada_em ?? undefined,
    attendanceId: row.codigo_atendimento,
  }
}
