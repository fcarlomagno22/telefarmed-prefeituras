import { supabaseAdmin } from '../../db/supabase.js'
import {
  isPreparacaoRascunhoExpired,
  mapPreparacaoRascunhoInputToDb,
  mapPreparacaoRascunhoRowToDto,
  resolvePreparacaoRascunhoExpiresAt,
  type RunWalkPreparacaoRascunhoDto,
  type RunWalkPreparacaoRascunhoRow,
  type UpsertRunWalkPreparacaoRascunhoInput,
} from './preparacao-rascunho.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

const PREPARACAO_RASCUNHO_SELECT =
  'id, paciente_id, entidade_contratante_id, modality, activity_name, intensity, duration_minutes, audio_configured, expires_at, criado_em, atualizado_em'

function mapRow(row: RunWalkPreparacaoRascunhoRow): RunWalkPreparacaoRascunhoRow {
  return {
    ...row,
    duration_minutes: Number(row.duration_minutes),
    audio_configured: Boolean(row.audio_configured),
  }
}

export async function findPreparacaoRascunho(
  scope: VdRunWalkPacienteScope,
): Promise<RunWalkPreparacaoRascunhoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_preparacao_rascunhos')
    .select(PREPARACAO_RASCUNHO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapRow(data as RunWalkPreparacaoRascunhoRow)
}

export async function deletePreparacaoRascunho(scope: VdRunWalkPacienteScope): Promise<void> {
  const { error } = await supabaseAdmin
    .from('run_walk_preparacao_rascunhos')
    .delete()
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)

  if (error) throw error
}

export async function deleteExpiredPreparacaoRascunho(scope: VdRunWalkPacienteScope): Promise<void> {
  const row = await findPreparacaoRascunho(scope)
  if (!row) return
  if (!isPreparacaoRascunhoExpired(row.expires_at)) return
  await deletePreparacaoRascunho(scope)
}

export async function upsertPreparacaoRascunho(
  scope: VdRunWalkPacienteScope,
  input: UpsertRunWalkPreparacaoRascunhoInput,
): Promise<RunWalkPreparacaoRascunhoDto> {
  const expiresAt = resolvePreparacaoRascunhoExpiresAt()
  const payload = mapPreparacaoRascunhoInputToDb(scope, input, expiresAt)

  const { data, error } = await supabaseAdmin
    .from('run_walk_preparacao_rascunhos')
    .upsert(payload, { onConflict: 'paciente_id' })
    .select(PREPARACAO_RASCUNHO_SELECT)
    .single()

  if (error) throw error

  return mapPreparacaoRascunhoRowToDto(mapRow(data as RunWalkPreparacaoRascunhoRow))
}

export async function loadPreparacaoRascunhoDto(
  scope: VdRunWalkPacienteScope,
): Promise<RunWalkPreparacaoRascunhoDto | null> {
  const row = await findPreparacaoRascunho(scope)
  if (!row) return null

  if (isPreparacaoRascunhoExpired(row.expires_at)) {
    await deletePreparacaoRascunho(scope)
    return null
  }

  return mapPreparacaoRascunhoRowToDto(row)
}
