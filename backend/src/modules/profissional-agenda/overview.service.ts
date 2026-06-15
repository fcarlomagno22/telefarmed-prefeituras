import { supabaseAdmin } from '../../db/supabase.js'
import { isPlantaoEncerradoParaProfissional } from '../../lib/escalaSlotLifecycle.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { loadProfissionalEscalaContext } from '../profissional-escala/context.service.js'
import {
  computeStatsFromConsultas,
  formatAgendaConsultaApi,
  formatPlantaoApi,
} from './formatters.js'
import { buildProfissionalAgendaNotices } from './notices.service.js'
import {
  resolveActiveSessionAutoCloseMeta,
  tryAutoClosePlantaoForProfissional,
} from './auto-close-plantao.service.js'
import { getActivePlantaoSession } from './sessao.service.js'
import type {
  AgendaConsultaRow,
  ConsultaClinicaRow,
  ProfissionalAgendaConsultaApi,
  ProfissionalAgendaOverviewApi,
  ProfissionalAgendaActiveSessionApi,
  SlotAgendaRow,
} from './types.js'
import type { OverviewQuery } from './schemas.js'
import type { ProfissionalAgendaContext } from './types.js'

type FilaRow = {
  agenda_consulta_id: string | null
  status: string
  chegada_em: string
  chamado_em: string | null
}

async function loadPlantoesInRange(
  ctx: ProfissionalAgendaContext,
  dateFrom: string,
  dateTo: string,
): Promise<Array<{ plantaoId: string; slotId: string; status: string }>> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, status, escala_slots!inner(data, hora_fim, status)')
    .eq('profissional_id', ctx.profissionalId)
    .eq('status', 'confirmado')
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)

  if (error) throw error

  return (data ?? [])
    .filter((row) => {
      const slot = row.escala_slots as unknown as {
        data: string
        hora_fim: string
        status: string
      }
      return !isPlantaoEncerradoParaProfissional({
        plantaoStatus: String(row.status),
        slotData: String(slot.data),
        slotHoraFim: String(slot.hora_fim),
        slotStatus: String(slot.status),
      })
    })
    .map((row) => ({
      plantaoId: String(row.id),
      slotId: String(row.slot_id),
      status: String(row.status),
    }))
}

function parseReserveQueueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

function buildReservePlantaoId(slotId: string): string {
  return `reserva-${slotId}`
}

async function loadReserveSlotsInRange(
  ctx: ProfissionalAgendaContext,
  dateFrom: string,
  dateTo: string,
  confirmedSlotIds: Set<string>,
): Promise<Array<{ plantaoId: string; slotId: string; status: string }>> {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('id, data, hora_fim, status, fila_reserva')
    .eq('status', 'publicada')
    .gte('data', dateFrom)
    .lte('data', dateTo)

  if (error) throw error

  const items: Array<{ plantaoId: string; slotId: string; status: string }> = []

  for (const row of data ?? []) {
    const slotId = String(row.id)
    if (confirmedSlotIds.has(slotId)) continue

    const reserveQueue = parseReserveQueueIds(row.fila_reserva)
    if (!reserveQueue.includes(ctx.profissionalId)) continue

    if (
      isPlantaoEncerradoParaProfissional({
        plantaoStatus: 'confirmado',
        slotData: String(row.data),
        slotHoraFim: String(row.hora_fim),
        slotStatus: String(row.status),
      })
    ) {
      continue
    }

    items.push({
      plantaoId: buildReservePlantaoId(slotId),
      slotId,
      status: 'confirmado',
    })
  }

  return items
}

async function loadSlotsByIds(slotIds: string[]): Promise<Map<string, SlotAgendaRow>> {
  if (slotIds.length === 0) return new Map()

  const unique = [...new Set(slotIds)]
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select(
      'id, data, hora_inicio, hora_fim, modalidade, profissional_titular_id, fila_reserva, unidade_nome, cidade, cidade_uf, especialidade_id, config_especialidades!inner(nome)',
    )
    .in('id', unique)

  if (error) throw error

  const map = new Map<string, SlotAgendaRow>()
  for (const row of data ?? []) {
    map.set(String(row.id), row as unknown as SlotAgendaRow)
  }
  return map
}

async function loadAgendaConsultas(
  ctx: ProfissionalAgendaContext,
  slotIds: string[],
  dateFrom: string,
  dateTo: string,
): Promise<AgendaConsultaRow[]> {
  const scopeFilter =
    slotIds.length > 0
      ? `profissional_id.eq.${ctx.profissionalId},escala_slot_id.in.(${slotIds.join(',')})`
      : `profissional_id.eq.${ctx.profissionalId}`

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
    .gte('data', dateFrom)
    .lte('data', dateTo)
    .not('status', 'eq', 'cancelado')
    .or(scopeFilter)

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

function resolvePlantaoForConsulta(
  row: AgendaConsultaRow,
  plantaoBySlotId: Map<string, { plantaoId: string; shiftId: string }>,
  plantoesByDate: Map<
    string,
    Array<{ plantaoId: string; shiftId: string; horaInicio: string; horaFim: string }>
  >,
): { plantaoId: string; shiftId: string } | null {
  if (row.escala_slot_id) {
    const match = plantaoBySlotId.get(String(row.escala_slot_id))
    if (match) return match
  }

  const dateKey = String(row.data)
  const candidates = plantoesByDate.get(dateKey) ?? []
  if (candidates.length === 0) return null

  if (candidates.length === 1) {
    return { plantaoId: candidates[0].plantaoId, shiftId: candidates[0].shiftId }
  }

  const hora = String(row.hora)
  const timed = candidates.find((item) => hora >= item.horaInicio && hora <= item.horaFim)
  if (timed) {
    return { plantaoId: timed.plantaoId, shiftId: timed.shiftId }
  }

  return { plantaoId: candidates[0].plantaoId, shiftId: candidates[0].shiftId }
}

function buildPlantoesByDate(
  plantoesRaw: Array<{ plantaoId: string; slotId: string }>,
  slotsById: Map<string, SlotAgendaRow>,
): Map<
  string,
  Array<{ plantaoId: string; shiftId: string; horaInicio: string; horaFim: string }>
> {
  const map = new Map<
    string,
    Array<{ plantaoId: string; shiftId: string; horaInicio: string; horaFim: string }>
  >()

  for (const item of plantoesRaw) {
    const slot = slotsById.get(item.slotId)
    if (!slot) continue

    const dateKey = String(slot.data)
    const list = map.get(dateKey) ?? []
    list.push({
      plantaoId: item.plantaoId,
      shiftId: item.plantaoId,
      horaInicio: String(slot.hora_inicio),
      horaFim: String(slot.hora_fim),
    })
    map.set(dateKey, list)
  }

  return map
}

export async function getProfissionalAgendaOverview(
  ctx: ProfissionalAgendaContext,
  query: OverviewQuery,
): Promise<ProfissionalAgendaOverviewApi> {
  const plantoesRaw = await loadPlantoesInRange(ctx, query.dateFrom, query.dateTo)
  const confirmedSlotIds = new Set(plantoesRaw.map((item) => item.slotId))
  const reserveSlotsRaw = await loadReserveSlotsInRange(
    ctx,
    query.dateFrom,
    query.dateTo,
    confirmedSlotIds,
  )
  const allPlantoesRaw = [...plantoesRaw, ...reserveSlotsRaw]
  const slotIds = allPlantoesRaw.map((item) => item.slotId)
  const slotsById = await loadSlotsByIds(slotIds)

  const plantaoBySlotId = new Map<string, { plantaoId: string; shiftId: string }>()
  for (const item of allPlantoesRaw) {
    plantaoBySlotId.set(item.slotId, {
      plantaoId: item.plantaoId,
      shiftId: item.plantaoId,
    })
  }
  const plantoesByDate = buildPlantoesByDate(allPlantoesRaw, slotsById)

  const agendaRows = await loadAgendaConsultas(ctx, slotIds, query.dateFrom, query.dateTo)
  const agendaIds = agendaRows.map((row) => row.id)
  const [consultasByAgenda, filaByAgenda] = await Promise.all([
    loadConsultasClinicasByAgendaIds(agendaIds),
    loadFilaByAgendaIds(agendaIds),
  ])

  const consultasByPlantao = new Map<string, ProfissionalAgendaConsultaApi[]>()
  const allConsultas: ProfissionalAgendaConsultaApi[] = []

  for (const row of agendaRows) {
    const plantaoRef = resolvePlantaoForConsulta(row, plantaoBySlotId, plantoesByDate)
    if (!plantaoRef) continue

    const fila = filaByAgenda.get(row.id)
    const consultaClinica = consultasByAgenda.get(row.id) ?? null
    const formatted = formatAgendaConsultaApi(row, {
      shiftId: plantaoRef.shiftId,
      plantaoId: plantaoRef.plantaoId,
      consultaClinica,
      inFila: Boolean(fila && ['aguardando', 'chamado', 'em_atendimento'].includes(fila.status)),
      filaChegadaEm: fila?.chegada_em ?? null,
      filaChamadoEm: fila?.chamado_em ?? null,
    })

    allConsultas.push(formatted)
    const list = consultasByPlantao.get(plantaoRef.plantaoId) ?? []
    list.push(formatted)
    consultasByPlantao.set(plantaoRef.plantaoId, list)
  }

  const plantoes = allPlantoesRaw
    .map((item) => {
      const slot = slotsById.get(item.slotId)
      if (!slot) return null
      const consultas = consultasByPlantao.get(item.plantaoId) ?? []
      return formatPlantaoApi(
        item.plantaoId,
        slot,
        ctx.profissionalId,
        item.status,
        computeStatsFromConsultas(consultas),
      )
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const shiftCountByDate: Record<string, number> = {}
  for (const plantao of plantoes) {
    shiftCountByDate[plantao.dateKey] = (shiftCountByDate[plantao.dateKey] ?? 0) + 1
  }

  const activeSession = await resolveActiveSessionForOverview(ctx.profissionalId)
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const notices = await buildProfissionalAgendaNotices(
    ctx,
    { dateFrom: query.dateFrom, dateTo: query.dateTo, todayKey },
    plantoes,
  )

  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    plantoes,
    consultas: allConsultas,
    shiftCountByDate,
    activeSession,
    notices,
  }
}

export async function listProfissionalAgendaPlantaoConsultas(
  ctx: ProfissionalAgendaContext,
  plantaoId: string,
): Promise<ProfissionalAgendaConsultaApi[]> {
  const { data: plantao, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id')
    .eq('id', plantaoId)
    .eq('profissional_id', ctx.profissionalId)
    .maybeSingle()

  if (error) throw error
  if (!plantao) return []

  const slotId = String(plantao.slot_id)
  const { data: slotRow } = await supabaseAdmin
    .from('escala_slots')
    .select('data')
    .eq('id', slotId)
    .maybeSingle()

  if (!slotRow) return []

  const dateKey = String(slotRow.data)
  const overview = await getProfissionalAgendaOverview(ctx, {
    dateFrom: dateKey,
    dateTo: dateKey,
  })

  return overview.consultas.filter((consulta) => consulta.plantaoId === plantaoId)
}

async function resolveActiveSessionForOverview(
  profissionalId: string,
): Promise<ProfissionalAgendaActiveSessionApi | null> {
  await tryAutoClosePlantaoForProfissional(profissionalId)

  const activeSession = await getActivePlantaoSession(profissionalId)
  if (!activeSession) return null

  const { data: plantao, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('slot_id')
    .eq('id', activeSession.plantaoId)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) throw error
  if (!plantao) return activeSession

  const meta = await resolveActiveSessionAutoCloseMeta(
    profissionalId,
    activeSession.plantaoId,
    String(plantao.slot_id),
  )

  if (!meta) return activeSession

  return {
    ...activeSession,
    scheduledEndAt: meta.scheduledEndAt,
    autoClosePending: meta.autoClosePending,
  }
}

export async function loadProfissionalAgendaContext(
  profissionalId: string,
): Promise<ProfissionalAgendaContext> {
  return loadProfissionalEscalaContext(profissionalId)
}
