import { supabaseAdmin } from '../../db/supabase.js'
import type { InsertSessaoRow, ListActiveMindSessoesQuery } from './sessoes.formatters.js'
import type { ActiveMindGameId, ActiveMindSessaoRow, VdActiveMindPacienteScope } from './types.js'

export const ACTIVE_MIND_SESSAO_SELECT =
  'id, paciente_id, entidade_contratante_id, client_session_id, game_id, difficulty, puzzle_id, duration_sec, attempts, correct, errors, reveals, completed_at, deleted_at, criado_em, atualizado_em'

function mapSessaoRow(row: ActiveMindSessaoRow): ActiveMindSessaoRow {
  return {
    ...row,
    duration_sec: row.duration_sec == null ? null : Number(row.duration_sec),
    attempts: Number(row.attempts),
    correct: Number(row.correct),
    errors: Number(row.errors),
    reveals: Number(row.reveals),
  }
}

export async function findByClientSessionId(
  scope: VdActiveMindPacienteScope,
  clientSessionId: string,
): Promise<ActiveMindSessaoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('active_mind_sessoes')
    .select(ACTIVE_MIND_SESSAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('client_session_id', clientSessionId)
    .maybeSingle()

  if (error) throw error
  return data ? mapSessaoRow(data as ActiveMindSessaoRow) : null
}

export async function findSessaoById(
  scope: VdActiveMindPacienteScope,
  id: string,
): Promise<ActiveMindSessaoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('active_mind_sessoes')
    .select(ACTIVE_MIND_SESSAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapSessaoRow(data as ActiveMindSessaoRow) : null
}

export async function insertSessao(row: InsertSessaoRow): Promise<ActiveMindSessaoRow> {
  const { data, error } = await supabaseAdmin
    .from('active_mind_sessoes')
    .insert(row)
    .select(ACTIVE_MIND_SESSAO_SELECT)
    .single()

  if (error) throw error
  return mapSessaoRow(data as ActiveMindSessaoRow)
}

export type ListSessoesRepositoryQuery = {
  bounds: { startIso: string | null; endIso: string | null }
  gameId: ActiveMindGameId | null
  page: number
  pageSize: number
}

export async function listSessoes(
  scope: VdActiveMindPacienteScope,
  filters: ListSessoesRepositoryQuery,
): Promise<{ rows: ActiveMindSessaoRow[]; totalCount: number }> {
  const offset = (filters.page - 1) * filters.pageSize
  const limit = offset + filters.pageSize - 1

  let listQuery = supabaseAdmin
    .from('active_mind_sessoes')
    .select(ACTIVE_MIND_SESSAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    listQuery = listQuery.gte('completed_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    listQuery = listQuery.lte('completed_at', filters.bounds.endIso)
  }

  if (filters.gameId) {
    listQuery = listQuery.eq('game_id', filters.gameId)
  }

  listQuery = listQuery.order('completed_at', { ascending: false }).range(offset, limit)

  let countQuery = supabaseAdmin
    .from('active_mind_sessoes')
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

  if (filters.gameId) {
    countQuery = countQuery.eq('game_id', filters.gameId)
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    listQuery,
    countQuery,
  ])

  if (error) throw error
  if (countError) throw countError

  return {
    rows: (data ?? []).map((row) => mapSessaoRow(row as ActiveMindSessaoRow)),
    totalCount: count ?? 0,
  }
}

export async function softDeleteSessao(
  scope: VdActiveMindPacienteScope,
  id: string,
): Promise<ActiveMindSessaoRow | null> {
  const existing = await findSessaoById(scope, id)
  if (!existing || existing.deleted_at) {
    return null
  }

  const deletedAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('active_mind_sessoes')
    .update({ deleted_at: deletedAt })
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('id', id)
    .is('deleted_at', null)
    .select(ACTIVE_MIND_SESSAO_SELECT)
    .maybeSingle()

  if (error) throw error
  return data ? mapSessaoRow(data as ActiveMindSessaoRow) : null
}

export type WeeklyStatsSessaoRow = Pick<
  ActiveMindSessaoRow,
  'game_id' | 'difficulty' | 'duration_sec' | 'attempts' | 'correct' | 'errors' | 'reveals'
>

export async function listSessoesForWeeklyStats(
  scope: VdActiveMindPacienteScope,
  bounds: { startIso: string; endIso: string },
): Promise<WeeklyStatsSessaoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('active_mind_sessoes')
    .select('game_id, difficulty, duration_sec, attempts, correct, errors, reveals')
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .gte('completed_at', bounds.startIso)
    .lte('completed_at', bounds.endIso)

  if (error) throw error

  return (data ?? []).map((row) => {
    const typed = row as WeeklyStatsSessaoRow
    return {
      game_id: typed.game_id,
      difficulty: typed.difficulty,
      duration_sec: typed.duration_sec == null ? null : Number(typed.duration_sec),
      attempts: Number(typed.attempts),
      correct: Number(typed.correct),
      errors: Number(typed.errors),
      reveals: Number(typed.reveals),
    }
  })
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

export function resolveSessaoListBounds(query: ListActiveMindSessoesQuery): {
  startIso: string | null
  endIso: string | null
  gameId: ActiveMindGameId | null
} {
  return {
    startIso: query.startIso ?? null,
    endIso: query.endIso ?? null,
    gameId: query.gameId ?? null,
  }
}
