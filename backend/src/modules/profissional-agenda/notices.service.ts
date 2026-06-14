import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { formatRelativeTimeAgo } from '../admin-clientes/formatters.js'
import type {
  ProfissionalAgendaContext,
  ProfissionalAgendaNoticeApi,
  ProfissionalAgendaPlantaoApi,
} from './types.js'

const TELEMEDICINE_LABEL = 'Telemedicina'
const TROCA_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000

type NoticeCandidate = ProfissionalAgendaNoticeApi & { sortAt: string }

type SlotNoticeRow = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  modalidade: string
  status: string
  publicado_em: string | null
  atualizado_em: string
  cancelado_em: string | null
  notas: string | null
  profissional_titular_id: string | null
  fila_reserva: unknown
  config_especialidades: { nome: string } | null
}

type PlantaoNoticeRow = {
  id: string
  status: string
  cancelado_em: string | null
  motivo_cancelamento: string | null
  confirmado_em: string | null
  escala_slots: SlotNoticeRow
}

function formatShiftDateBr(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function formatTimeRange(start: string, end: string): string {
  const format = (time: string) => {
    const parts = String(time).split(':')
    return `${parts[0] ?? '00'}:${parts[1] ?? '00'}`
  }
  return `${format(start)}–${format(end)}`
}

function resolveModalityLabel(modalidade: string): string {
  if (modalidade === 'presencial_ubt') return 'presencial'
  if (modalidade === 'hibrido') return 'híbrido'
  return TELEMEDICINE_LABEL
}

function parseReserveQueue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String)
}

function isActiveNotice(notice: ProfissionalAgendaNoticeApi, todayKey: string): boolean {
  return !notice.shiftDateKey || notice.shiftDateKey >= todayKey
}

function buildReservaNoticesFromPlantoes(
  plantoes: ProfissionalAgendaPlantaoApi[],
  todayKey: string,
): NoticeCandidate[] {
  const notices: NoticeCandidate[] = []

  for (const plantao of plantoes) {
    if (plantao.dateKey < todayKey) continue
    if (plantao.role !== 'reserva') continue
    if (plantao.plantaoStatus === 'cancelado') continue

    notices.push({
      id: `reserva-${plantao.plantaoId}`,
      type: 'reserva',
      title: 'Você está na fila de reserva',
      body: `No plantão de ${plantao.specialty} (${formatShiftDateBr(plantao.dateKey)}, ${plantao.turnLabel.toLowerCase()}), você é médico de reserva. Será acionado se o titular não entrar no horário.`,
      dateLabel: plantao.dateKey === todayKey ? 'Hoje' : formatShiftDateBr(plantao.dateKey),
      shiftDateKey: plantao.dateKey,
      sortAt: plantao.startAt,
    })
  }

  return notices
}

async function loadCancelledPlantaoNotices(
  ctx: ProfissionalAgendaContext,
  dateFrom: string,
  dateTo: string,
): Promise<NoticeCandidate[]> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      status,
      cancelado_em,
      motivo_cancelamento,
      confirmado_em,
      escala_slots!inner(
        id,
        data,
        hora_inicio,
        hora_fim,
        modalidade,
        status,
        publicado_em,
        atualizado_em,
        cancelado_em,
        notas,
        profissional_titular_id,
        fila_reserva,
        config_especialidades!inner(nome)
      )
    `,
    )
    .eq('profissional_id', ctx.profissionalId)
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)

  if (error) {
    if (
      isMissingSupabaseResource(error, 'escala_plantoes_confirmados') ||
      isMissingSupabaseResource(error, 'escala_slots')
    ) {
      return []
    }
    throw error
  }

  const notices: NoticeCandidate[] = []

  for (const row of (data ?? []) as unknown as PlantaoNoticeRow[]) {
    const slot = row.escala_slots
    if (row.status !== 'cancelado' && slot.status !== 'cancelada') continue
    const specialty = String(slot.config_especialidades?.nome ?? 'Plantão')
    const dateKey = String(slot.data)
    const cancelledAt = row.cancelado_em ?? slot.cancelado_em ?? slot.atualizado_em
    const byAdmin = slot.status === 'cancelada' || !row.motivo_cancelamento?.includes('profissional')
    const reason = row.motivo_cancelamento?.trim() || slot.notas?.trim()

    notices.push({
      id: `cancelamento-${row.id}`,
      type: 'cancelamento',
      title: 'Plantão cancelado',
      body: byAdmin
        ? `O plantão de ${specialty} em ${formatShiftDateBr(dateKey)} foi cancelado pela operação.${reason ? ` Motivo: ${reason}.` : ''} Nenhuma ação é necessária.`
        : `Seu plantão de ${specialty} em ${formatShiftDateBr(dateKey)} (${formatTimeRange(slot.hora_inicio, slot.hora_fim)}) foi cancelado.`,
      dateLabel: formatRelativeTimeAgo(cancelledAt),
      shiftDateKey: dateKey,
      sortAt: cancelledAt,
    })
  }

  return notices
}

async function loadScheduleUpdateNotices(
  ctx: ProfissionalAgendaContext,
  dateFrom: string,
  dateTo: string,
): Promise<NoticeCandidate[]> {
  const cutoff = new Date(Date.now() - TROCA_LOOKBACK_MS).toISOString()

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      status,
      confirmado_em,
      escala_slots!inner(
        id,
        data,
        hora_inicio,
        hora_fim,
        modalidade,
        status,
        publicado_em,
        atualizado_em,
        cancelado_em,
        notas,
        profissional_titular_id,
        fila_reserva,
        config_especialidades!inner(nome)
      )
    `,
    )
    .eq('profissional_id', ctx.profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)
    .gte('escala_slots.atualizado_em', cutoff)
    .neq('escala_slots.status', 'cancelada')

  if (error) {
    if (
      isMissingSupabaseResource(error, 'escala_plantoes_confirmados') ||
      isMissingSupabaseResource(error, 'escala_slots')
    ) {
      return []
    }
    throw error
  }

  const notices: NoticeCandidate[] = []

  for (const row of (data ?? []) as unknown as PlantaoNoticeRow[]) {
    const slot = row.escala_slots
    if (!slot.publicado_em) continue

    const publishedAt = Date.parse(slot.publicado_em)
    const updatedAt = Date.parse(slot.atualizado_em)
    if (Number.isNaN(publishedAt) || Number.isNaN(updatedAt)) continue
    if (updatedAt <= publishedAt + 60_000) continue

    const specialty = String(slot.config_especialidades?.nome ?? 'Plantão')
    const dateKey = String(slot.data)

    notices.push({
      id: `troca-${row.id}-${slot.atualizado_em}`,
      type: 'troca',
      title: 'Horário do plantão atualizado',
      body: `Seu plantão de ${specialty} em ${formatShiftDateBr(dateKey)} foi atualizado para ${formatTimeRange(slot.hora_inicio, slot.hora_fim)}. Modalidade: ${resolveModalityLabel(slot.modalidade)}.`,
      dateLabel: formatRelativeTimeAgo(slot.atualizado_em),
      shiftDateKey: dateKey,
      sortAt: slot.atualizado_em,
    })
  }

  return notices
}

async function loadReserveQueueNotices(
  ctx: ProfissionalAgendaContext,
  dateFrom: string,
  dateTo: string,
  todayKey: string,
): Promise<NoticeCandidate[]> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      status,
      confirmado_em,
      escala_slots!inner(
        id,
        data,
        hora_inicio,
        hora_fim,
        modalidade,
        status,
        publicado_em,
        atualizado_em,
        cancelado_em,
        notas,
        profissional_titular_id,
        fila_reserva,
        config_especialidades!inner(nome)
      )
    `,
    )
    .eq('profissional_id', ctx.profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)

  if (error) {
    if (
      isMissingSupabaseResource(error, 'escala_plantoes_confirmados') ||
      isMissingSupabaseResource(error, 'escala_slots')
    ) {
      return []
    }
    throw error
  }

  const notices: NoticeCandidate[] = []

  for (const row of (data ?? []) as unknown as PlantaoNoticeRow[]) {
    const slot = row.escala_slots
    const dateKey = String(slot.data)
    if (dateKey < todayKey) continue

    const reserveQueue = parseReserveQueue(slot.fila_reserva)
    const position = reserveQueue.indexOf(ctx.profissionalId)
    if (position < 0) continue
    if (slot.profissional_titular_id === ctx.profissionalId) continue

    const specialty = String(slot.config_especialidades?.nome ?? 'Plantão')
    const ordinal = position + 1

    notices.push({
      id: `reserva-fila-${row.id}`,
      type: 'reserva',
      title: 'Você está na fila de reserva',
      body: `No plantão de ${specialty} (${formatShiftDateBr(dateKey)}), você é o ${ordinal}º médico de reserva. Será acionado se o titular não entrar até o início do turno.`,
      dateLabel: dateKey === todayKey ? 'Hoje' : formatShiftDateBr(dateKey),
      shiftDateKey: dateKey,
      sortAt: row.confirmado_em ?? slot.atualizado_em,
    })
  }

  return notices
}

export async function buildProfissionalAgendaNotices(
  ctx: ProfissionalAgendaContext,
  params: { dateFrom: string; dateTo: string; todayKey: string },
  plantoes: ProfissionalAgendaPlantaoApi[],
): Promise<ProfissionalAgendaNoticeApi[]> {
  const [cancelled, scheduleUpdates, reserveQueue, reserveFromPlantoes] = await Promise.all([
    loadCancelledPlantaoNotices(ctx, params.dateFrom, params.dateTo),
    loadScheduleUpdateNotices(ctx, params.dateFrom, params.dateTo),
    loadReserveQueueNotices(ctx, params.dateFrom, params.dateTo, params.todayKey),
    Promise.resolve(buildReservaNoticesFromPlantoes(plantoes, params.todayKey)),
  ])

  const merged = new Map<string, NoticeCandidate>()

  for (const notice of [
    ...cancelled,
    ...scheduleUpdates,
    ...reserveQueue,
    ...reserveFromPlantoes,
  ]) {
    merged.set(notice.id, notice)
  }

  return [...merged.values()]
    .filter((notice) => isActiveNotice(notice, params.todayKey))
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .slice(0, 12)
    .map(({ sortAt: _sortAt, ...notice }) => notice)
}
