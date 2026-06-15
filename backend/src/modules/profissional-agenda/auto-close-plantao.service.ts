import { supabaseAdmin } from '../../db/supabase.js'
import { isSlotEndReached, resolveSlotTimestampIso } from '../../lib/escalaDateTime.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { computeStatsFromConsultas, formatAgendaConsultaApi } from './formatters.js'
import { endProfissionalPlantao } from './sessao.service.js'
import type {
  AgendaConsultaRow,
  ConsultaClinicaRow,
  ProfissionalAgendaConsultaApi,
  ProfissionalAgendaEndShiftSummaryInput,
} from './types.js'

type ActiveSessaoRow = {
  id: string
  plantao_id: string
  profissional_id: string
  slot_id: string
  entered_at: string
  escala_slots: { data: string; hora_fim: string }
}

type FilaRow = {
  agenda_consulta_id: string | null
  status: string
  chegada_em: string
  chamado_em: string | null
}

export type AutoClosePlantaoResult =
  | { status: 'closed'; plantaoId: string }
  | { status: 'waiting_consultation'; plantaoId: string }
  | { status: 'not_due' }
  | { status: 'no_active_session' }

async function profissionalHasActiveConsultation(profissionalId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('profissional_id', profissionalId)
    .eq('status', 'em_andamento')
    .limit(1)

  if (error) {
    if (isMissingSupabaseResource(error, 'consultas')) return false
    throw error
  }

  return (data ?? []).length > 0
}

async function loadAgendaConsultasForSlot(
  profissionalId: string,
  slotId: string,
  dateKey: string,
): Promise<AgendaConsultaRow[]> {
  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select(
      `
      id, paciente_id, profissional_id, escala_slot_id, especialidade_id, origem, status,
      data, hora, observacoes, unidade_ubt_id,
      pacientes!inner(nome, cpf, data_nascimento),
      config_especialidades!inner(nome),
      unidades_ubt!inner(nome)
    `,
    )
    .eq('data', dateKey)
    .eq('escala_slot_id', slotId)
    .not('status', 'eq', 'cancelado')
    .or(`profissional_id.eq.${profissionalId},profissional_id.is.null`)

  if (error) {
    if (
      isMissingSupabaseResource(error, 'agenda_consultas') ||
      isMissingSupabaseResource(error, 'pacientes') ||
      isMissingSupabaseResource(error, 'unidades_ubt')
    ) {
      return []
    }
    throw error
  }

  return (data ?? []) as unknown as AgendaConsultaRow[]
}

async function loadConsultasClinicasByAgendaIds(
  agendaIds: string[],
): Promise<Map<string, ConsultaClinicaRow>> {
  if (agendaIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      'id, codigo_atendimento, agenda_consulta_id, status, iniciada_em, finalizada_em, duracao_minutos, sala_espera_entrada_em',
    )
    .in('agenda_consulta_id', agendaIds)

  if (error) {
    if (isMissingSupabaseResource(error, 'consultas')) return new Map()
    throw error
  }

  const map = new Map<string, ConsultaClinicaRow>()
  for (const row of data ?? []) {
    if (row.agenda_consulta_id) {
      map.set(String(row.agenda_consulta_id), row as ConsultaClinicaRow)
    }
  }
  return map
}

async function loadFilaByAgendaIds(agendaIds: string[]): Promise<Map<string, FilaRow>> {
  if (agendaIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('agenda_consulta_id, status, chegada_em, chamado_em')
    .in('agenda_consulta_id', agendaIds)
    .in('status', ['aguardando', 'chamado', 'em_atendimento', 'finalizado', 'desistiu'])

  if (error) {
    if (isMissingSupabaseResource(error, 'fila_espera')) return new Map()
    throw error
  }

  const map = new Map<string, FilaRow>()
  for (const row of data ?? []) {
    if (row.agenda_consulta_id) {
      map.set(String(row.agenda_consulta_id), row as FilaRow)
    }
  }
  return map
}

async function loadPlantaoConsultas(
  profissionalId: string,
  plantaoId: string,
  slotId: string,
): Promise<ProfissionalAgendaConsultaApi[]> {
  const { data: slotRow, error: slotError } = await supabaseAdmin
    .from('escala_slots')
    .select('data')
    .eq('id', slotId)
    .maybeSingle()

  if (slotError) throw slotError
  if (!slotRow) return []

  const dateKey = String(slotRow.data)
  const agendaRows = await loadAgendaConsultasForSlot(profissionalId, slotId, dateKey)
  const agendaIds = agendaRows.map((row) => row.id)
  const [consultasByAgenda, filaByAgenda] = await Promise.all([
    loadConsultasClinicasByAgendaIds(agendaIds),
    loadFilaByAgendaIds(agendaIds),
  ])

  return agendaRows.map((row) => {
    const fila = filaByAgenda.get(row.id)
    const consultaClinica = consultasByAgenda.get(row.id) ?? null
    return formatAgendaConsultaApi(row, {
      shiftId: plantaoId,
      plantaoId,
      consultaClinica,
      inFila: Boolean(fila && ['aguardando', 'chamado', 'em_atendimento'].includes(fila.status)),
      filaChegadaEm: fila?.chegada_em ?? null,
      filaChamadoEm: fila?.chamado_em ?? null,
    })
  })
}

async function buildPlantaoEndSummary(
  profissionalId: string,
  plantaoId: string,
  slotId: string,
  enteredAt: string,
  endedAt: string,
): Promise<ProfissionalAgendaEndShiftSummaryInput> {
  const consultas = await loadPlantaoConsultas(profissionalId, plantaoId, slotId)
  const stats = computeStatsFromConsultas(consultas)
  const atendidos = consultas.filter((item) => item.status === 'finalizado').length
  const naoCompareceu = consultas.filter((item) => item.status === 'nao_compareceu').length
  const desistiu = consultas.filter((item) => item.status === 'desistiu').length
  const enteredMs = new Date(enteredAt).getTime()
  const endedMs = new Date(endedAt).getTime()
  const duracaoPlantaoMin =
    !Number.isNaN(enteredMs) && !Number.isNaN(endedMs) && endedMs > enteredMs
      ? Math.max(1, Math.round((endedMs - enteredMs) / 60_000))
      : 1

  return {
    atendidos,
    naoCompareceu,
    desistiu,
    tempoMedioMin: stats.tempoMedioMin,
    duracaoPlantaoMin,
  }
}

async function loadActiveSessionPastEnd(
  profissionalId: string,
): Promise<ActiveSessaoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select(
      'id, plantao_id, profissional_id, slot_id, entered_at, escala_slots!inner(data, hora_fim)',
    )
    .eq('profissional_id', profissionalId)
    .is('ended_at', null)
    .maybeSingle()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_plantao_sessoes')) return null
    throw error
  }

  if (!data) return null

  const row = data as unknown as ActiveSessaoRow
  const slot = row.escala_slots
  if (!isSlotEndReached(slot.data, slot.hora_fim)) return null

  return row
}

async function loadAllActiveSessionsPastEnd(): Promise<ActiveSessaoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select(
      'id, plantao_id, profissional_id, slot_id, entered_at, escala_slots!inner(data, hora_fim)',
    )
    .is('ended_at', null)

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_plantao_sessoes')) return []
    throw error
  }

  return (data ?? [])
    .map((item) => item as unknown as ActiveSessaoRow)
    .filter((row) => isSlotEndReached(row.escala_slots.data, row.escala_slots.hora_fim))
}

async function tryCloseExpiredSession(row: ActiveSessaoRow): Promise<AutoClosePlantaoResult> {
  const plantaoId = String(row.plantao_id)
  const profissionalId = String(row.profissional_id)

  if (await profissionalHasActiveConsultation(profissionalId)) {
    return { status: 'waiting_consultation', plantaoId }
  }

  const endedAt = new Date().toISOString()
  const summary = await buildPlantaoEndSummary(
    profissionalId,
    plantaoId,
    String(row.slot_id),
    String(row.entered_at),
    endedAt,
  )

  await endProfissionalPlantao(profissionalId, plantaoId, summary, {
    encerramentoAutomatico: true,
    endedAt,
  })

  return { status: 'closed', plantaoId }
}

export async function tryAutoClosePlantaoForProfissional(
  profissionalId: string,
): Promise<AutoClosePlantaoResult> {
  const session = await loadActiveSessionPastEnd(profissionalId)
  if (!session) {
    const { data: anyActive } = await supabaseAdmin
      .from('profissional_plantao_sessoes')
      .select('id')
      .eq('profissional_id', profissionalId)
      .is('ended_at', null)
      .maybeSingle()

    if (!anyActive) return { status: 'no_active_session' }

    return { status: 'not_due' }
  }

  return tryCloseExpiredSession(session)
}

export async function runAutoCloseExpiredPlantoes(): Promise<number> {
  const sessions = await loadAllActiveSessionsPastEnd()
  let closed = 0

  for (const session of sessions) {
    const result = await tryCloseExpiredSession(session)
    if (result.status === 'closed') closed += 1
  }

  return closed
}

export async function resolveActiveSessionAutoCloseMeta(
  profissionalId: string,
  _plantaoId: string,
  slotId: string,
): Promise<{ scheduledEndAt: string; autoClosePending: boolean } | null> {
  const { data: slot, error } = await supabaseAdmin
    .from('escala_slots')
    .select('data, hora_fim')
    .eq('id', slotId)
    .maybeSingle()

  if (error || !slot) return null

  const scheduledEndAt = resolveSlotTimestampIso(String(slot.data), String(slot.hora_fim))
  const shiftExpired = isSlotEndReached(String(slot.data), String(slot.hora_fim))
  if (!shiftExpired) {
    return { scheduledEndAt, autoClosePending: false }
  }

  const hasConsultation = await profissionalHasActiveConsultation(profissionalId)
  return { scheduledEndAt, autoClosePending: hasConsultation }
}
