import { supabaseAdmin } from '../../db/supabase.js'
import type { VdRunWalkPacienteScope } from './types.js'
import type { RunWalkLivePointRow, RunWalkLiveSessionRow } from './live-sessions.formatters.js'

export const RUN_WALK_LIVE_SESSION_SELECT =
  'id, share_token, participant_name, activity_name, is_active, started_at, expires_at, created_at, paciente_id, entidade_contratante_id, created_by_cpf'

export const RUN_WALK_LIVE_POINT_SELECT =
  'id, session_id, latitude, longitude, accuracy_meters, recorded_at'

export type InsertRunWalkLiveSessionRow = {
  share_token: string
  participant_name: string
  activity_name: string
  is_active: boolean
  expires_at: string
  paciente_id: string
  entidade_contratante_id: string
  created_by_cpf: string
}

export type InsertRunWalkLivePointRow = {
  session_id: string
  latitude: number
  longitude: number
  accuracy_meters: number | null
  recorded_at: string
}

export async function insertLiveSession(
  input: InsertRunWalkLiveSessionRow,
): Promise<RunWalkLiveSessionRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_live_sessions')
    .insert(input)
    .select(RUN_WALK_LIVE_SESSION_SELECT)
    .single()

  if (error) throw error
  return data as RunWalkLiveSessionRow
}

export async function findLiveSessionById(
  scope: VdRunWalkPacienteScope,
  sessionId: string,
): Promise<RunWalkLiveSessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_live_sessions')
    .select(RUN_WALK_LIVE_SESSION_SELECT)
    .eq('id', sessionId)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunWalkLiveSessionRow
}

export async function endLiveSession(
  scope: VdRunWalkPacienteScope,
  sessionId: string,
): Promise<RunWalkLiveSessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_live_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .select(RUN_WALK_LIVE_SESSION_SELECT)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunWalkLiveSessionRow
}

export async function insertLivePoints(
  rows: InsertRunWalkLivePointRow[],
): Promise<RunWalkLivePointRow[]> {
  if (rows.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('run_walk_live_points')
    .insert(rows)
    .select(RUN_WALK_LIVE_POINT_SELECT)

  if (error) throw error
  return (data ?? []) as RunWalkLivePointRow[]
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}
