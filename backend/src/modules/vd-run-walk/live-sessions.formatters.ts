import type { z } from 'zod'
import type {
  appendLiveSessionPointsBodySchema,
  createLiveSessionBodySchema,
} from './schemas.js'
import type { VdRunWalkPacienteScope } from './types.js'

const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LIVE_SHARE_SESSION_TTL_HOURS = 12
const LIVE_SHARE_DEDICATED_WEB_BASE_URL = 'https://seguranca.telefarmed.com.br'

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionBodySchema>
export type AppendLiveSessionPointsInput = z.infer<typeof appendLiveSessionPointsBodySchema>

export type LiveSharePointDto = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export type LiveShareSessionDto = {
  id: string
  shareToken: string
  participantName: string
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
}

export type CreateLiveSessionResultDto = {
  session: LiveShareSessionDto
  shareToken: string
  shareUrl: string
  points: LiveSharePointDto[]
}

export type AppendLiveSessionPointsResultDto = {
  points: LiveSharePointDto[]
  insertedCount: number
}

export type EndLiveSessionResultDto = {
  session: LiveShareSessionDto
}

export type RunWalkLiveSessionRow = {
  id: string
  share_token: string
  participant_name: string
  activity_name: string
  is_active: boolean
  started_at: string
  expires_at: string
  created_at: string
  paciente_id: string | null
  entidade_contratante_id: string | null
  created_by_cpf: string | null
}

export type RunWalkLivePointRow = {
  id: string
  session_id: string
  latitude: number
  longitude: number
  accuracy_meters: number | null
  recorded_at: string
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

export function resolveLiveShareWebBaseUrl(): string {
  const explicit = process.env.LIVE_SHARE_WEB_BASE_URL?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  return LIVE_SHARE_DEDICATED_WEB_BASE_URL
}

export function buildLiveSharePublicUrl(shareToken: string): string {
  return `${resolveLiveShareWebBaseUrl()}/${shareToken}`
}

export function generateLiveShareToken(length = 8): string {
  let token = ''
  for (let index = 0; index < length; index += 1) {
    token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  }
  return token
}

export function resolveLiveSessionExpiresAt(from = new Date()): string {
  return new Date(from.getTime() + LIVE_SHARE_SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString()
}

export function mapLiveSessionRow(row: RunWalkLiveSessionRow): LiveShareSessionDto {
  return {
    id: row.id,
    shareToken: row.share_token,
    participantName: row.participant_name,
    activityName: row.activity_name,
    isActive: row.is_active,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
  }
}

export function mapLivePointRow(row: RunWalkLivePointRow): LiveSharePointDto {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyMeters: row.accuracy_meters,
    recordedAt: row.recorded_at,
  }
}

export function mapCreateInputToInsertRow(
  scope: VdRunWalkPacienteScope,
  input: CreateLiveSessionInput,
  shareToken: string,
) {
  return {
    share_token: shareToken,
    participant_name: input.participantName.trim(),
    activity_name: input.activityName.trim(),
    is_active: true,
    expires_at: resolveLiveSessionExpiresAt(),
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    created_by_cpf: scope.cpf,
  }
}

export function mapPointInputToInsertRow(
  sessionId: string,
  point: AppendLiveSessionPointsInput['points'][number],
) {
  return {
    session_id: sessionId,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy_meters: point.accuracyMeters ?? null,
    recorded_at: point.recordedAt ?? new Date().toISOString(),
  }
}

export function isLiveSessionExpired(row: RunWalkLiveSessionRow, now = Date.now()): boolean {
  const expiresAtMs = new Date(row.expires_at).getTime()
  return Number.isFinite(expiresAtMs) && expiresAtMs <= now
}
