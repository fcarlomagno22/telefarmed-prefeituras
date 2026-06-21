import { supabaseAdmin } from '../../db/supabase.js'
import { generateCodigoAtendimento } from '../../lib/codigoAtendimento.js'
import { formatAgendaConsultaRows } from '../ubt-agenda/formatters.js'
import { assertPacienteBelongsToEntity } from '../ubt-pacientes/ownership.js'
import type { DayAppointmentDto } from '../ubt-agenda/types.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { UbtRh3Error } from './errors.js'

export type PersistRh3ConsultaInput = {
  pacienteId: string
  especialidadeId: string
  telefoneContato?: string
  data: string
  hora: string
  scheduled: boolean
  profissionalId?: string | null
  profissionalMtId?: string | null
  rh3: {
    idInvitacion: number
    idTurno?: number
    deeplink?: string
  }
}

export type PersistRh3ConsultaResult = {
  agendaConsultaId: string
  consultaId: string
  codigoAtendimento: string
  appointment: DayAppointmentDto
}

function normalizeHoraForDb(hora: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(hora.trim())
  if (!match) {
    throw new UbtRh3Error('Horário inválido para registrar consulta.', 'INVALID_TIME', 400)
  }
  return `${match[1]}:${match[2]}:00`
}

async function loadAgendaAppointmentDto(
  scope: UbtScope,
  agendaConsultaId: string,
): Promise<DayAppointmentDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_ubt_agenda_consultas')
    .select('*')
    .eq('id', agendaConsultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtRh3Error('Consulta registrada não encontrada na agenda.', 'NOT_FOUND', 500)
  }

  const [appointment] = await formatAgendaConsultaRows([
    data as Parameters<typeof formatAgendaConsultaRows>[0][number],
  ])
  if (!appointment) {
    throw new UbtRh3Error('Consulta registrada não encontrada na agenda.', 'NOT_FOUND', 500)
  }

  return appointment
}

export async function persistRh3ConsultaForUbt(
  scope: UbtScope,
  input: PersistRh3ConsultaInput,
): Promise<PersistRh3ConsultaResult> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, input.pacienteId)

  const recepcionadoEm = new Date().toISOString()
  const agendaStatus = input.scheduled ? 'agendado' : 'aguardando'
  const horaDb = normalizeHoraForDb(input.hora)

  const { data: agendaRow, error: agendaError } = await supabaseAdmin
    .from('agenda_consultas')
    .insert({
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: input.pacienteId,
      profissional_id: input.profissionalId ?? null,
      especialidade_id: input.especialidadeId,
      tipo: 'encaixe',
      origem: 'espontaneo',
      status: agendaStatus,
      data: input.data,
      hora: horaDb,
      telefone_contato: input.telefoneContato?.trim() ?? '',
      criado_por_usuario_ubt_id: scope.operadorId,
      recepcionado_em: recepcionadoEm,
      recepcionado_por_usuario_ubt_id: scope.operadorId,
    })
    .select('id')
    .single()

  if (agendaError) throw agendaError
  if (!agendaRow) {
    throw new UbtRh3Error('Falha ao registrar consulta na agenda.', 'PERSIST_FAILED', 500)
  }

  const agendaConsultaId = String(agendaRow.id)
  const codigoAtendimento = generateCodigoAtendimento()
  const now = new Date().toISOString()

  const { data: consultaRow, error: consultaError } = await supabaseAdmin
    .from('consultas')
    .insert({
      codigo_atendimento: codigoAtendimento,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: input.pacienteId,
      profissional_id: input.profissionalId ?? null,
      especialidade_id: input.especialidadeId,
      agenda_consulta_id: agendaConsultaId,
      tipo: 'consulta',
      status: 'aguardando_medico',
      origem_atendimento: 'mt',
      rh3_id_invitacion: input.rh3.idInvitacion,
      rh3_id_turno: input.rh3.idTurno ?? null,
      rh3_deeplink: input.rh3.deeplink?.trim() ?? '',
      profissional_mt_id: input.profissionalMtId ?? null,
      sala_espera_entrada_em: input.scheduled ? null : now,
      criado_em: now,
    })
    .select('id')
    .single()

  if (consultaError) {
    await supabaseAdmin.from('agenda_consultas').delete().eq('id', agendaConsultaId)
    throw consultaError
  }

  if (!consultaRow) {
    await supabaseAdmin.from('agenda_consultas').delete().eq('id', agendaConsultaId)
    throw new UbtRh3Error('Falha ao registrar consulta clínica.', 'PERSIST_FAILED', 500)
  }

  const appointment = await loadAgendaAppointmentDto(scope, agendaConsultaId)

  return {
    agendaConsultaId,
    consultaId: String(consultaRow.id),
    codigoAtendimento,
    appointment,
  }
}
