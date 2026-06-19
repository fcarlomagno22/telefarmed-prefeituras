import { supabaseAdmin } from '../../db/supabase.js'
import { formatAgendaConsultaRow, formatAgendaConsultaRows } from './formatters.js'
import { checkInUbtFila, syncFilaWithAgendaStatus } from '../ubt-triagem/fila.service.js'
import { UbtTriagemError } from '../ubt-triagem/errors.js'
import { UbtAgendaError } from './errors.js'
import {
  assertConsultaBelongsToUnit,
  assertPacienteBelongsToEntity,
  assertProfissionalOnUnitSchedule,
} from './ownership.js'
import { assertSlotAvailable } from './catalog.service.js'
import { todayIsoInBrazil } from './slot-utils.js'
import type { CreateConsultaBody, UpdateConsultaBody, WalkInBody } from './schemas.js'
import type { DayAppointmentDto, UbtScope } from './types.js'

async function loadConsultaDto(scope: UbtScope, consultaId: string): Promise<DayAppointmentDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_ubt_agenda_consultas')
    .select('*')
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtAgendaError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const [appointment] = await formatAgendaConsultaRows([
    data as Parameters<typeof formatAgendaConsultaRow>[0],
  ])
  if (!appointment) {
    throw new UbtAgendaError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }
  return appointment
}

export async function createUbtAgendaConsulta(
  scope: UbtScope,
  body: CreateConsultaBody,
): Promise<DayAppointmentDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, body.pacienteId)
  await assertProfissionalOnUnitSchedule(
    scope,
    body.profissionalId,
    body.data,
    body.especialidadeId,
  )
  await assertSlotAvailable(scope, body.profissionalId, body.data, body.hora)

  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .insert({
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: body.pacienteId,
      profissional_id: body.profissionalId,
      escala_slot_id: body.escalaSlotId ?? null,
      especialidade_id: body.especialidadeId,
      tipo: body.tipo ?? 'consulta',
      origem: 'agendado',
      status: 'agendado',
      data: body.data,
      hora: `${body.hora}:00`,
      telefone_contato: body.telefoneContato?.trim() ?? '',
      observacoes: body.observacoes?.trim() ?? '',
      criado_por_usuario_ubt_id: scope.operadorId,
    })
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new UbtAgendaError('Falha ao criar consulta.', 'CREATE_FAILED', 500)

  return loadConsultaDto(scope, String(data.id))
}

export async function createUbtAgendaWalkIn(
  scope: UbtScope,
  body: WalkInBody,
): Promise<DayAppointmentDto> {
  const today = todayIsoInBrazil()
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, body.pacienteId)
  await assertProfissionalOnUnitSchedule(
    scope,
    body.profissionalId,
    today,
    body.especialidadeId,
  )
  await assertSlotAvailable(scope, body.profissionalId, today, body.hora)

  const recepcionadoEm = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .insert({
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: body.pacienteId,
      profissional_id: body.profissionalId,
      especialidade_id: body.especialidadeId,
      tipo: 'encaixe',
      origem: 'espontaneo',
      status: 'aguardando',
      data: today,
      hora: `${body.hora}:00`,
      telefone_contato: body.telefoneContato?.trim() ?? '',
      observacoes: body.observacoes?.trim() ?? '',
      criado_por_usuario_ubt_id: scope.operadorId,
      recepcionado_em: recepcionadoEm,
      recepcionado_por_usuario_ubt_id: scope.operadorId,
    })
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new UbtAgendaError('Falha ao registrar encaixe.', 'CREATE_FAILED', 500)

  const consultaId = String(data.id)
  try {
    await checkInUbtFila(scope, consultaId)
  } catch (checkInError) {
    if (!(checkInError instanceof UbtTriagemError && checkInError.code === 'PACIENTE_JA_NA_FILA')) {
      throw checkInError
    }
  }

  return loadConsultaDto(scope, consultaId)
}

export async function updateUbtAgendaConsulta(
  scope: UbtScope,
  consultaId: string,
  body: UpdateConsultaBody,
): Promise<DayAppointmentDto> {
  const current = await assertConsultaBelongsToUnit(scope, consultaId)

  if (current.status === 'realizado' || current.status === 'cancelado') {
    throw new UbtAgendaError('Consulta não pode ser alterada neste status.', 'INVALID_STATUS', 409)
  }

  const targetDate = body.data ?? String(current.data)
  const targetHora = body.hora ?? String(current.hora).slice(0, 5)
  const targetProfissional = body.profissionalId
  const targetEspecialidade = body.especialidadeId

  if (targetProfissional && targetEspecialidade) {
    await assertProfissionalOnUnitSchedule(
      scope,
      targetProfissional,
      targetDate,
      targetEspecialidade,
    )
  }

  if (body.hora || body.data || body.profissionalId) {
    const profissionalId =
      body.profissionalId ??
      (
        await supabaseAdmin
          .from('agenda_consultas')
          .select('profissional_id')
          .eq('id', consultaId)
          .maybeSingle()
      ).data?.profissional_id

    if (!profissionalId) {
      throw new UbtAgendaError('Profissional não informado.', 'INVALID_DATA', 400)
    }

    await assertSlotAvailable(scope, String(profissionalId), targetDate, targetHora, consultaId)
  }

  const patch: Record<string, unknown> = {}
  if (body.profissionalId) patch.profissional_id = body.profissionalId
  if (body.especialidadeId) patch.especialidade_id = body.especialidadeId
  if (body.data) patch.data = body.data
  if (body.hora) patch.hora = `${body.hora}:00`
  if (body.telefoneContato !== undefined) patch.telefone_contato = body.telefoneContato.trim()
  if (body.observacoes !== undefined) patch.observacoes = body.observacoes.trim()
  if (body.status) {
    patch.status = body.status
    if (body.status === 'aguardando' && !current.recepcionado_em) {
      patch.recepcionado_em = new Date().toISOString()
      patch.recepcionado_por_usuario_ubt_id = scope.operadorId
    }
  }

  const { error } = await supabaseAdmin
    .from('agenda_consultas')
    .update(patch)
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)

  if (error) throw error

  if (body.status) {
    await syncFilaWithAgendaStatus(scope, consultaId, body.status)
  }

  return loadConsultaDto(scope, consultaId)
}

export async function cancelUbtAgendaConsulta(scope: UbtScope, consultaId: string): Promise<void> {
  const current = await assertConsultaBelongsToUnit(scope, consultaId)

  if (current.status === 'realizado' || current.status === 'cancelado') {
    throw new UbtAgendaError('Consulta não pode ser cancelada.', 'INVALID_STATUS', 409)
  }

  const { error } = await supabaseAdmin
    .from('agenda_consultas')
    .update({
      status: 'cancelado',
      cancelado_em: new Date().toISOString(),
      cancelado_por_usuario_ubt_id: scope.operadorId,
    })
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)

  if (error) throw error

  await supabaseAdmin
    .from('fila_espera')
    .update({
      status: 'desistiu',
      encerrado_em: new Date().toISOString(),
    })
    .eq('agenda_consulta_id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .in('status', ['aguardando', 'chamado'])
}

export async function confirmUbtAgendaRecepcao(
  scope: UbtScope,
  consultaId: string,
): Promise<DayAppointmentDto> {
  const current = await assertConsultaBelongsToUnit(scope, consultaId)

  if (current.status !== 'agendado') {
    throw new UbtAgendaError(
      'Somente consultas agendadas podem confirmar chegada.',
      'INVALID_STATUS',
      409,
    )
  }

  const { error } = await supabaseAdmin
    .from('agenda_consultas')
    .update({
      status: 'aguardando',
      recepcionado_em: new Date().toISOString(),
      recepcionado_por_usuario_ubt_id: scope.operadorId,
    })
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)

  if (error) throw error

  try {
    await checkInUbtFila(scope, consultaId)
  } catch (checkInError) {
    if (!(checkInError instanceof UbtTriagemError && checkInError.code === 'PACIENTE_JA_NA_FILA')) {
      throw checkInError
    }
  }

  return loadConsultaDto(scope, consultaId)
}

export async function markUbtAgendaFalta(
  scope: UbtScope,
  consultaId: string,
): Promise<DayAppointmentDto> {
  const current = await assertConsultaBelongsToUnit(scope, consultaId)

  if (current.status !== 'agendado' && current.status !== 'aguardando') {
    throw new UbtAgendaError('Consulta não pode ser marcada como falta.', 'INVALID_STATUS', 409)
  }

  const { error } = await supabaseAdmin
    .from('agenda_consultas')
    .update({ status: 'faltou' })
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)

  if (error) throw error
  await syncFilaWithAgendaStatus(scope, consultaId, 'faltou')
  return loadConsultaDto(scope, consultaId)
}
