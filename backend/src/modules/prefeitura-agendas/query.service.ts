import { supabaseAdmin } from '../../db/supabase.js'
import type { AgendaAggregateRow } from './types.js'

const AGGREGATE_SELECT =
  'unidade_ubt_id, data, hora, status, tipo, telefone_contato, especialidade_id, origem, escala_slot_id'

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

export async function fetchAgendaRowsForPeriod(
  entidadeId: string,
  dateStart: string,
  dateEnd: string,
  unitIds?: string[],
): Promise<AgendaAggregateRow[]> {
  let query = supabaseAdmin
    .from('agenda_consultas')
    .select(AGGREGATE_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .gte('data', dateStart)
    .lte('data', dateEnd)
    .neq('status', 'cancelado')

  if (unitIds && unitIds.length > 0) {
    query = query.in('unidade_ubt_id', unitIds)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as AgendaAggregateRow[]
}

export async function fetchCancelledAgendaRowsForPeriod(
  entidadeId: string,
  dateStart: string,
  dateEnd: string,
  unitIds?: string[],
): Promise<AgendaAggregateRow[]> {
  let query = supabaseAdmin
    .from('agenda_consultas')
    .select(AGGREGATE_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .gte('data', dateStart)
    .lte('data', dateEnd)
    .eq('status', 'cancelado')

  if (unitIds && unitIds.length > 0) {
    query = query.in('unidade_ubt_id', unitIds)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as AgendaAggregateRow[]
}

export async function fetchUnitDailyCapacities(
  entidadeId: string,
  unitIds: string[],
): Promise<Map<string, number>> {
  if (unitIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, capacidade_diaria')
    .eq('entidade_contratante_id', entidadeId)
    .in('id', unitIds)

  if (error) {
    if (isMissingRelationError(error)) return new Map()
    throw error
  }

  const capacities = new Map<string, number>()
  for (const row of data ?? []) {
    const capacity = Number((row as { capacidade_diaria?: number }).capacidade_diaria ?? 0)
    capacities.set(String((row as { id: string }).id), Math.max(0, capacity))
  }

  return capacities
}
