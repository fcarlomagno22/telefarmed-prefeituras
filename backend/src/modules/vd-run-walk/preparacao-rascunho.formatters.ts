import type { RunWalkModality } from './types.js'

export const RUN_WALK_PREPARACAO_RASCUNHO_TTL_MS = 24 * 60 * 60 * 1000

export type RunWalkPreparacaoRascunhoRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  modality: RunWalkModality
  activity_name: string
  intensity: string
  duration_minutes: number
  audio_configured: boolean
  expires_at: string
  criado_em: string
  atualizado_em: string
}

export type RunWalkPreparacaoRascunhoDto = {
  modality: RunWalkModality
  activityName: string
  intensity: string
  durationMinutes: number
  audioConfigured: boolean
  updatedAt: string
  expiresAt: string
}

export type RunWalkPreparacaoRascunhoResultDto = {
  draft: RunWalkPreparacaoRascunhoDto | null
}

export type UpsertRunWalkPreparacaoRascunhoInput = {
  modality: RunWalkModality
  activityName: string
  intensity: string
  durationMinutes: number
  audioConfigured: boolean
}

export function isPreparacaoRascunhoExpired(
  expiresAt: string,
  nowMs = Date.now(),
): boolean {
  const expiresMs = Date.parse(expiresAt)
  if (!Number.isFinite(expiresMs)) return true
  return expiresMs <= nowMs
}

export function resolvePreparacaoRascunhoExpiresAt(
  now = new Date(),
  ttlMs = RUN_WALK_PREPARACAO_RASCUNHO_TTL_MS,
): string {
  return new Date(now.getTime() + ttlMs).toISOString()
}

export function mapPreparacaoRascunhoRowToDto(
  row: RunWalkPreparacaoRascunhoRow,
): RunWalkPreparacaoRascunhoDto {
  return {
    modality: row.modality,
    activityName: row.activity_name,
    intensity: row.intensity,
    durationMinutes: row.duration_minutes,
    audioConfigured: row.audio_configured,
    updatedAt: row.atualizado_em,
    expiresAt: row.expires_at,
  }
}

export function mapPreparacaoRascunhoInputToDb(
  scope: { pacienteId: string; entidadeContratanteId: string },
  input: UpsertRunWalkPreparacaoRascunhoInput,
  expiresAtIso: string,
) {
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    modality: input.modality,
    activity_name: input.activityName.trim(),
    intensity: input.intensity.trim(),
    duration_minutes: input.durationMinutes,
    audio_configured: input.audioConfigured,
    expires_at: expiresAtIso,
    atualizado_em: new Date().toISOString(),
  }
}
