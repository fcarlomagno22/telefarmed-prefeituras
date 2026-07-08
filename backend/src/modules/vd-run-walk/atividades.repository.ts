import { supabaseAdmin } from '../../db/supabase.js'
import type { ListRunWalkAtividadesQuery } from './atividades.formatters.js'
import type { RunWalkAtividadeRow, VdRunWalkPacienteScope } from './types.js'

export const RUN_WALK_ATIVIDADE_SELECT =
  'id, paciente_id, entidade_contratante_id, client_activity_id, modality, activity_name, elapsed_seconds, distance_km, average_speed_kmh, pace_min_per_km, step_count, heart_rate_bpm, estimated_calories, active_minutes, completed_at, trail_simplified, trail_point_count, location_city, location_state, check_in, check_in_skipped, deleted_at, criado_em, atualizado_em'

export const RUN_WALK_ATIVIDADE_SUMMARY_SELECT =
  'id, paciente_id, entidade_contratante_id, client_activity_id, modality, activity_name, elapsed_seconds, distance_km, average_speed_kmh, pace_min_per_km, step_count, heart_rate_bpm, estimated_calories, active_minutes, completed_at, trail_point_count, location_city, location_state, check_in, check_in_skipped, deleted_at, criado_em, atualizado_em'

function mapAtividadeRow(row: RunWalkAtividadeRow): RunWalkAtividadeRow {
  return {
    ...row,
    distance_km: Number(row.distance_km),
    average_speed_kmh:
      row.average_speed_kmh == null ? null : Number(row.average_speed_kmh),
    pace_min_per_km: row.pace_min_per_km == null ? null : Number(row.pace_min_per_km),
    trail_simplified:
      'trail_simplified' in row && row.trail_simplified && typeof row.trail_simplified === 'object'
        ? row.trail_simplified
        : [],
    check_in:
      row.check_in && typeof row.check_in === 'object' && !Array.isArray(row.check_in)
        ? row.check_in
        : null,
  }
}

export const RUN_WALK_ATIVIDADE_RESUMO_SELECT =
  'id, activity_name, modality, distance_km, active_minutes, estimated_calories, elapsed_seconds, pace_min_per_km, completed_at'

export type ListAtividadesForResumoBounds = {
  startIso: string | null
  endIso: string | null
}

export async function listAtividadesForResumo(
  scope: VdRunWalkPacienteScope,
  bounds: ListAtividadesForResumoBounds,
): Promise<
  Array<{
    id: string
    activity_name: string
    modality: RunWalkAtividadeRow['modality']
    distance_km: number
    active_minutes: number
    estimated_calories: number
    elapsed_seconds: number
    pace_min_per_km: number | null
    completed_at: string
  }>
> {
  let query = supabaseAdmin
    .from('run_walk_atividades')
    .select(RUN_WALK_ATIVIDADE_RESUMO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (bounds.startIso) {
    query = query.gte('completed_at', bounds.startIso)
  }

  if (bounds.endIso) {
    query = query.lte('completed_at', bounds.endIso)
  }

  const { data, error } = await query.order('completed_at', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    activity_name: String((row as { activity_name: string }).activity_name),
    modality: (row as { modality: RunWalkAtividadeRow['modality'] }).modality,
    distance_km: Number((row as { distance_km: number }).distance_km),
    active_minutes: Number((row as { active_minutes: number }).active_minutes),
    estimated_calories: Number((row as { estimated_calories: number }).estimated_calories),
    elapsed_seconds: Number((row as { elapsed_seconds: number }).elapsed_seconds),
    pace_min_per_km:
      (row as { pace_min_per_km: number | null }).pace_min_per_km == null
        ? null
        : Number((row as { pace_min_per_km: number }).pace_min_per_km),
    completed_at: String((row as { completed_at: string }).completed_at),
  }))
}

export type ListAtividadesRepositoryQuery = {
  bounds: { startIso: string | null; endIso: string | null }
  sort: ListRunWalkAtividadesQuery['sort']
  minDistanceKm: number
  page: number
  pageSize: number
}

function applyAtividadeListFilters<
  T extends {
    eq: (column: string, value: string) => T
    is: (column: string, value: null) => T
    gte: (column: string, value: string | number) => T
    lte: (column: string, value: string) => T
  },
>(query: T, scope: VdRunWalkPacienteScope, filters: ListAtividadesRepositoryQuery): T {
  let next = query
    .eq('paciente_id', scope.pacienteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    next = next.gte('completed_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    next = next.lte('completed_at', filters.bounds.endIso)
  }

  if (filters.minDistanceKm > 0) {
    next = next.gte('distance_km', filters.minDistanceKm)
  }

  return next
}

function applyAtividadeListSort<
  T extends {
    order: (
      column: string,
      options: { ascending: boolean; nullsFirst?: boolean },
    ) => T
  },
>(query: T, sort: ListRunWalkAtividadesQuery['sort']): T {
  if (sort === 'distance') {
    return query
      .order('distance_km', { ascending: false })
      .order('completed_at', { ascending: false })
  }

  if (sort === 'duration') {
    return query
      .order('elapsed_seconds', { ascending: false })
      .order('completed_at', { ascending: false })
  }

  return query.order('completed_at', { ascending: false })
}

export async function listAtividades(
  scope: VdRunWalkPacienteScope,
  filters: ListAtividadesRepositoryQuery,
): Promise<{ rows: RunWalkAtividadeRow[]; totalCount: number }> {
  const offset = (filters.page - 1) * filters.pageSize
  const limit = offset + filters.pageSize - 1

  let listQuery = supabaseAdmin
    .from('run_walk_atividades')
    .select(RUN_WALK_ATIVIDADE_SUMMARY_SELECT)

  listQuery = applyAtividadeListFilters(listQuery, scope, filters)
  listQuery = applyAtividadeListSort(listQuery, filters.sort)
  listQuery = listQuery.range(offset, limit)

  const { data, error } = await listQuery
  if (error) throw error

  let countQuery = supabaseAdmin
    .from('run_walk_atividades')
    .select('id', { count: 'exact', head: true })

  countQuery = applyAtividadeListFilters(countQuery, scope, filters)

  const { count: totalCount, error: countError } = await countQuery
  if (countError) throw countError

  return {
    rows: (data ?? []).map((row) => mapAtividadeRow(row as RunWalkAtividadeRow)),
    totalCount: totalCount ?? 0,
  }
}

export type InsertRunWalkAtividadeRow = {
  paciente_id: string
  entidade_contratante_id: string
  client_activity_id: string
  modality: RunWalkAtividadeRow['modality']
  activity_name: string
  elapsed_seconds: number
  distance_km: number
  average_speed_kmh: number | null
  pace_min_per_km: number | null
  step_count: number
  heart_rate_bpm: number
  estimated_calories: number
  active_minutes: number
  completed_at: string
  trail_simplified: unknown
  trail_point_count: number
  location_city: string | null
  location_state: string | null
  check_in: unknown | null
  check_in_skipped: boolean
}

export async function listAtividadesForWeek(
  scope: VdRunWalkPacienteScope,
  bounds: { startIso: string; endIso: string },
): Promise<Array<Pick<RunWalkAtividadeRow, 'active_minutes' | 'completed_at'>>> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select('active_minutes, completed_at')
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .gte('completed_at', bounds.startIso)
    .lte('completed_at', bounds.endIso)

  if (error) throw error

  return (data ?? []).map((row) => ({
    active_minutes: Number((row as { active_minutes: number }).active_minutes),
    completed_at: String((row as { completed_at: string }).completed_at),
  }))
}

export async function listAtividadesForWeekProgress(
  scope: VdRunWalkPacienteScope,
  bounds: { startIso: string; endIso: string },
): Promise<
  Array<{
    id: string
    modality: RunWalkAtividadeRow['modality']
    activity_name: string
    active_minutes: number
    completed_at: string
  }>
> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select('id, modality, activity_name, active_minutes, completed_at')
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .gte('completed_at', bounds.startIso)
    .lte('completed_at', bounds.endIso)
    .order('completed_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    modality: (row as { modality: RunWalkAtividadeRow['modality'] }).modality,
    activity_name: String((row as { activity_name: string }).activity_name),
    active_minutes: Number((row as { active_minutes: number }).active_minutes),
    completed_at: String((row as { completed_at: string }).completed_at),
  }))
}

export async function softDeleteAtividade(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
): Promise<'deleted' | 'already_deleted' | 'not_found'> {
  const existing = await findAtividadeById(scope, atividadeId)
  if (!existing) {
    const { data: deletedRow, error: deletedLookupError } = await supabaseAdmin
      .from('run_walk_atividades')
      .select('id')
      .eq('id', atividadeId)
      .eq('paciente_id', scope.pacienteId)
      .eq('entidade_contratante_id', scope.entidadeContratanteId)
      .not('deleted_at', 'is', null)
      .maybeSingle()

    if (deletedLookupError) throw deletedLookupError
    if (deletedRow) return 'already_deleted'
    return 'not_found'
  }

  const { error } = await supabaseAdmin
    .from('run_walk_atividades')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', atividadeId)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (error) throw error
  return 'deleted'
}

export async function findAtividadeById(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
): Promise<RunWalkAtividadeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select(RUN_WALK_ATIVIDADE_SELECT)
    .eq('id', atividadeId)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapAtividadeRow(data as RunWalkAtividadeRow)
}

export async function findAtividadeByClientActivityId(
  scope: VdRunWalkPacienteScope,
  clientActivityId: string,
): Promise<RunWalkAtividadeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select(RUN_WALK_ATIVIDADE_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('client_activity_id', clientActivityId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapAtividadeRow(data as RunWalkAtividadeRow)
}

export async function insertAtividade(
  input: InsertRunWalkAtividadeRow,
): Promise<RunWalkAtividadeRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .insert(input)
    .select(RUN_WALK_ATIVIDADE_SELECT)
    .single()

  if (error) throw error

  return mapAtividadeRow(data as RunWalkAtividadeRow)
}

export type UpdateAtividadeCheckinRow = {
  check_in: unknown | null
  check_in_skipped: boolean
}

export async function updateAtividadeCheckin(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
  patch: UpdateAtividadeCheckinRow,
): Promise<RunWalkAtividadeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .update({
      check_in: patch.check_in,
      check_in_skipped: patch.check_in_skipped,
    })
    .eq('id', atividadeId)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .select(RUN_WALK_ATIVIDADE_SELECT)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapAtividadeRow(data as RunWalkAtividadeRow)
}

export async function countAtividadesByPaciente(
  scope: VdRunWalkPacienteScope,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select('id', { count: 'exact', head: true })
    .eq('paciente_id', scope.pacienteId)
    .is('deleted_at', null)

  if (error) throw error
  return count ?? 0
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}
