import { supabaseAdmin } from '../../db/supabase.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import { slotMatchesProfissionalScope } from './context.service.js'
import { ProfissionalEscalaError } from './errors.js'
import { formatProfissionalSlotRow } from './formatters.js'
import type { ListDisponiveisQuery } from './schemas.js'
import type {
  ProfissionalEscalaContext,
  ProfissionalEscalaSlotDto,
  ProfissionalSlotDisponivelRow,
} from './types.js'

async function loadClaimedSlotIds(profissionalId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('slot_id')
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])

  if (error) throw error
  return new Set((data ?? []).map((row) => String(row.slot_id)))
}

export async function listProfissionalEscalaDisponiveis(
  ctx: ProfissionalEscalaContext,
  params: ListDisponiveisQuery = {},
): Promise<ProfissionalEscalaSlotDto[]> {
  let query = supabaseAdmin
    .from('vw_profissional_escala_slots_disponiveis')
    .select('*')
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (params.dateFrom) query = query.gte('data', params.dateFrom)
  if (params.dateTo) query = query.lte('data', params.dateTo)

  const [slotsResult, claimedSlotIds] = await Promise.all([
    query,
    loadClaimedSlotIds(ctx.profissionalId),
  ])

  if (slotsResult.error) throw slotsResult.error

  const rows = (slotsResult.data ?? []) as ProfissionalSlotDisponivelRow[]

  return rows
    .filter((row) => slotMatchesProfissionalScope(row, ctx))
    .filter((row) => !claimedSlotIds.has(String(row.id)))
    .filter((row) => Number(row.vagas_disponiveis ?? 0) > 0)
    .map((row) => formatProfissionalSlotRow(row))
}

export async function loadSlotDisponivelForClaim(
  slotId: string,
  ctx: ProfissionalEscalaContext,
): Promise<ProfissionalSlotDisponivelRow> {
  const { data, error } = await supabaseAdmin
    .from('vw_profissional_escala_slots_disponiveis')
    .select('*')
    .eq('id', slotId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalEscalaError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }

  const row = data as ProfissionalSlotDisponivelRow

  if (!slotMatchesProfissionalScope(row, ctx)) {
    throw new ProfissionalEscalaError(
      'Você não tem permissão para este plantão.',
      'FORBIDDEN',
      403,
    )
  }

  if (Number(row.vagas_disponiveis ?? 0) <= 0) {
    throw new ProfissionalEscalaError(
      'Não foi possível reservar este plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  return row
}

export async function assertNoScheduleConflict(
  profissionalId: string,
  startAt: string,
  endAt: string,
  excludeSlotId?: string,
): Promise<void> {
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new ProfissionalEscalaError('Horário do plantão inválido.', 'INVALID_DATA', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      'id, slot_id, escala_slots!inner(id, data, hora_inicio, hora_fim, status)',
    )
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])

  if (error) throw error

  for (const row of data ?? []) {
    const slotId = String(row.slot_id)
    if (excludeSlotId && slotId === excludeSlotId) continue

    const slot = row.escala_slots as unknown as {
      data: string
      hora_inicio: string
      hora_fim: string
      status: string
    }

    if (slot.status === 'cancelada') continue

    const existingStart = new Date(formatLocalTimestampAsIso(`${slot.data} ${slot.hora_inicio}`)).getTime()
    const existingEnd = new Date(formatLocalTimestampAsIso(`${slot.data} ${slot.hora_fim}`)).getTime()

    if (startMs < existingEnd && endMs > existingStart) {
      throw new ProfissionalEscalaError(
        'Você já possui um plantão confirmado neste horário.',
        'SCHEDULE_CONFLICT',
        409,
      )
    }
  }
}
