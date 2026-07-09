import { supabaseAdmin } from '../../db/supabase.js'
import type { InsertSessaoRow, ListFunctionalTrainingSessoesQuery } from './sessoes.formatters.js'
import type { FunctionalTrainingSessaoRow, VdFunctionalTrainingPacienteScope } from './types.js'

export const FUNCTIONAL_TRAINING_SESSAO_SELECT =
  'id, paciente_id, entidade_contratante_id, client_session_id, modo, duration_sec, total_active_sec, exercise_ids, completed_at, deleted_at, criado_em, atualizado_em'

function mapSessaoRow(row: FunctionalTrainingSessaoRow): FunctionalTrainingSessaoRow {
  return {
    ...row,
    exercise_ids: Array.isArray(row.exercise_ids) ? row.exercise_ids.map(String) : [],
  }
}

export async function findSessaoByClientSessionId(
  scope: VdFunctionalTrainingPacienteScope,
  clientSessionId: string,
): Promise<FunctionalTrainingSessaoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_sessoes')
    .select(FUNCTIONAL_TRAINING_SESSAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('client_session_id', clientSessionId)
    .maybeSingle()

  if (error) throw error
  return data ? mapSessaoRow(data as FunctionalTrainingSessaoRow) : null
}

export async function insertSessao(row: InsertSessaoRow): Promise<FunctionalTrainingSessaoRow> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_sessoes')
    .insert(row)
    .select(FUNCTIONAL_TRAINING_SESSAO_SELECT)
    .single()

  if (error) throw error
  return mapSessaoRow(data as FunctionalTrainingSessaoRow)
}

export type ListSessoesRepositoryQuery = {
  bounds: { startIso: string | null; endIso: string | null }
  page: number
  pageSize: number
}

export async function listSessoes(
  scope: VdFunctionalTrainingPacienteScope,
  filters: ListSessoesRepositoryQuery,
): Promise<{ rows: FunctionalTrainingSessaoRow[]; totalCount: number }> {
  const offset = (filters.page - 1) * filters.pageSize
  const limit = offset + filters.pageSize - 1

  let listQuery = supabaseAdmin
    .from('functional_training_sessoes')
    .select(FUNCTIONAL_TRAINING_SESSAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    listQuery = listQuery.gte('completed_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    listQuery = listQuery.lte('completed_at', filters.bounds.endIso)
  }

  listQuery = listQuery.order('completed_at', { ascending: false }).range(offset, limit)

  let countQuery = supabaseAdmin
    .from('functional_training_sessoes')
    .select('id', { count: 'exact', head: true })
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    countQuery = countQuery.gte('completed_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    countQuery = countQuery.lte('completed_at', filters.bounds.endIso)
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    listQuery,
    countQuery,
  ])

  if (error) throw error
  if (countError) throw countError

  return {
    rows: (data ?? []).map((row) => mapSessaoRow(row as FunctionalTrainingSessaoRow)),
    totalCount: count ?? 0,
  }
}

export async function listSessoesForWeeklyStats(
  scope: VdFunctionalTrainingPacienteScope,
  bounds: { startIso: string; endIso: string },
): Promise<Array<Pick<FunctionalTrainingSessaoRow, 'total_active_sec' | 'exercise_ids'>>> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_sessoes')
    .select('total_active_sec, exercise_ids')
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .gte('completed_at', bounds.startIso)
    .lte('completed_at', bounds.endIso)

  if (error) throw error

  return (data ?? []).map((row) => ({
    total_active_sec: Number((row as { total_active_sec: number }).total_active_sec),
    exercise_ids: Array.isArray((row as { exercise_ids: string[] }).exercise_ids)
      ? (row as { exercise_ids: string[] }).exercise_ids.map(String)
      : [],
  }))
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

export function resolveSessaoListBounds(query: ListFunctionalTrainingSessoesQuery): {
  startIso: string | null
  endIso: string | null
} {
  return {
    startIso: query.startIso ?? null,
    endIso: query.endIso ?? null,
  }
}
