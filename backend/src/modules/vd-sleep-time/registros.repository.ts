import { supabaseAdmin } from '../../db/supabase.js'
import type { InsertRegistroRow } from './registros.formatters.js'
import type { SleepTimeRegistroRow, VdSleepTimePacienteScope } from './types.js'

export const SLEEP_TIME_REGISTRO_SELECT =
  'id, paciente_id, entidade_contratante_id, client_log_id, bed_at, wake_at, duration_minutes, quality, wake_count, notes, deleted_at, criado_em, atualizado_em'

function mapRegistroRow(row: SleepTimeRegistroRow): SleepTimeRegistroRow {
  return {
    ...row,
    quality: Number(row.quality) as SleepTimeRegistroRow['quality'],
    duration_minutes: Number(row.duration_minutes),
    wake_count: Number(row.wake_count),
  }
}

export async function findRegistroByClientLogId(
  scope: VdSleepTimePacienteScope,
  clientLogId: string,
): Promise<SleepTimeRegistroRow | null> {
  const { data, error } = await supabaseAdmin
    .from('sleep_time_registros')
    .select(SLEEP_TIME_REGISTRO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('client_log_id', clientLogId)
    .maybeSingle()

  if (error) throw error
  return data ? mapRegistroRow(data as SleepTimeRegistroRow) : null
}

export async function findRegistroById(
  scope: VdSleepTimePacienteScope,
  id: string,
): Promise<SleepTimeRegistroRow | null> {
  const { data, error } = await supabaseAdmin
    .from('sleep_time_registros')
    .select(SLEEP_TIME_REGISTRO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapRegistroRow(data as SleepTimeRegistroRow) : null
}

export async function insertRegistro(row: InsertRegistroRow): Promise<SleepTimeRegistroRow> {
  const { data, error } = await supabaseAdmin
    .from('sleep_time_registros')
    .insert(row)
    .select(SLEEP_TIME_REGISTRO_SELECT)
    .single()

  if (error) throw error
  return mapRegistroRow(data as SleepTimeRegistroRow)
}

export type ListRegistrosRepositoryQuery = {
  bounds: { startIso: string | null; endIso: string | null }
  page: number
  pageSize: number
}

export async function listRegistros(
  scope: VdSleepTimePacienteScope,
  filters: ListRegistrosRepositoryQuery,
): Promise<{ rows: SleepTimeRegistroRow[]; totalCount: number }> {
  const offset = (filters.page - 1) * filters.pageSize
  const limit = offset + filters.pageSize - 1

  let listQuery = supabaseAdmin
    .from('sleep_time_registros')
    .select(SLEEP_TIME_REGISTRO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    listQuery = listQuery.gte('wake_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    listQuery = listQuery.lte('wake_at', filters.bounds.endIso)
  }

  listQuery = listQuery.order('wake_at', { ascending: false }).range(offset, limit)

  let countQuery = supabaseAdmin
    .from('sleep_time_registros')
    .select('id', { count: 'exact', head: true })
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)

  if (filters.bounds.startIso) {
    countQuery = countQuery.gte('wake_at', filters.bounds.startIso)
  }

  if (filters.bounds.endIso) {
    countQuery = countQuery.lte('wake_at', filters.bounds.endIso)
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    listQuery,
    countQuery,
  ])

  if (error) throw error
  if (countError) throw countError

  return {
    rows: (data ?? []).map((row) => mapRegistroRow(row as SleepTimeRegistroRow)),
    totalCount: count ?? 0,
  }
}

export async function softDeleteRegistro(
  scope: VdSleepTimePacienteScope,
  id: string,
): Promise<SleepTimeRegistroRow | null> {
  const existing = await findRegistroById(scope, id)
  if (!existing || existing.deleted_at) {
    return null
  }

  const deletedAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('sleep_time_registros')
    .update({ deleted_at: deletedAt })
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('id', id)
    .is('deleted_at', null)
    .select(SLEEP_TIME_REGISTRO_SELECT)
    .maybeSingle()

  if (error) throw error
  return data ? mapRegistroRow(data as SleepTimeRegistroRow) : null
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}
