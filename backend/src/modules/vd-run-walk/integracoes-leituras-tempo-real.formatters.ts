import { formatAtividadeSteps } from '../vd-metricas/atividade.formatters.js'
import { leituraToHeartRateHistoryEntry } from '../vd-metricas/frequencia-cardiaca.formatters.js'
import {
  parseIntegracaoPermissions,
  rowToIntegracaoMetricasDto,
} from '../vd-metricas/integracoes.formatters.js'
import type { PacienteMetricasIntegracaoRow, PacienteMetricasLeituraRow } from '../vd-metricas/types.js'

export const RUN_WALK_INTEGRACOES_LEITURAS_POLL_HINT_MS = 10_000
export const RUN_WALK_INTEGRACOES_LEITURAS_DEFAULT_MAX_AGE_SECONDS = 120

export const RUN_WALK_INTEGRACOES_LEITURAS_LIMITATIONS = [
  'Leituras derivam de dados já sincronizados no backend (POST /vd/metricas/atividade/lote e POST /vd/metricas/frequencia-cardiaca); não há SDK nativo nem streaming em tempo real no servidor.',
  'Passos via lote são agregados por dia; sessionDelta soma novas leituras de passos após sessionStartedAt, não substitui GPS do app.',
  'Frequência cardíaca pode estar defasada se o dispositivo ou app não enviar leituras durante o treino.',
  'Integrações conectadas em paciente_metricas_integracoes indicam permissão; a disponibilidade de dados depende de sync prévio do cliente.',
] as const

export type RunWalkIntegracaoResumoDto = {
  integrationId: string
  status: 'connected' | 'disconnected'
  permissions: string[]
  connectedAt: string | null
  lastSyncedAt?: string
  connectedDeviceName?: string
}

export type RunWalkIntegracaoHeartRateDto = {
  available: boolean
  bpm: number | null
  recordedAt: string | null
  source: 'integracao' | 'manual' | null
  sourceLabel?: string
  context?: 'resting' | 'workout' | 'sleep' | 'manual'
  stale: boolean
}

export type RunWalkIntegracaoStepsDto = {
  available: boolean
  todayTotal: number | null
  sessionDelta: number | null
  recordedAt: string | null
  sourceLabel?: string
}

export type RunWalkIntegracoesLeiturasTempoRealDto = {
  integrationActive: boolean
  integrations: RunWalkIntegracaoResumoDto[]
  heartRate: RunWalkIntegracaoHeartRateDto
  steps: RunWalkIntegracaoStepsDto
  fetchedAt: string
  pollIntervalMs: number
  limitations: readonly string[]
}

export function integrationRowsToSummaries(
  rows: PacienteMetricasIntegracaoRow[],
): RunWalkIntegracaoResumoDto[] {
  return rows.map((row) => {
    const dto = rowToIntegracaoMetricasDto(row)
    return {
      integrationId: row.integration_id,
      status: row.status,
      permissions: parseIntegracaoPermissions(row.permissions),
      connectedAt: row.conectado_em,
      ...(dto.lastSyncedAt ? { lastSyncedAt: dto.lastSyncedAt } : {}),
      ...(dto.connectedDeviceName ? { connectedDeviceName: dto.connectedDeviceName } : {}),
    }
  })
}

export function hasConnectedIntegrationPermission(
  rows: PacienteMetricasIntegracaoRow[],
  permission: 'heart-rate' | 'steps',
): boolean {
  return rows.some((row) => {
    if (row.status !== 'connected') return false
    return parseIntegracaoPermissions(row.permissions).includes(permission)
  })
}

export function isIntegrationActiveForLiveReadings(
  rows: PacienteMetricasIntegracaoRow[],
): boolean {
  return (
    hasConnectedIntegrationPermission(rows, 'heart-rate') ||
    hasConnectedIntegrationPermission(rows, 'steps')
  )
}

function isReadingStale(recordedAt: string | null, maxAgeSeconds: number, nowMs = Date.now()) {
  if (!recordedAt) return true
  const recordedMs = Date.parse(recordedAt)
  if (!Number.isFinite(recordedMs)) return true
  return nowMs - recordedMs > maxAgeSeconds * 1000
}

export function buildHeartRateReading(
  row: PacienteMetricasLeituraRow | null,
  input: {
    available: boolean
    maxAgeSeconds: number
    nowIso?: string
  },
): RunWalkIntegracaoHeartRateDto {
  if (!input.available || !row) {
    return {
      available: false,
      bpm: null,
      recordedAt: null,
      source: null,
      stale: true,
    }
  }

  const entry = leituraToHeartRateHistoryEntry(row)
  const stale = isReadingStale(
    entry.recordedAt,
    input.maxAgeSeconds,
    input.nowIso ? Date.parse(input.nowIso) : Date.now(),
  )

  return {
    available: !stale,
    bpm: stale ? null : entry.bpm,
    recordedAt: entry.recordedAt,
    source: entry.source,
    ...(entry.sourceLabel ? { sourceLabel: entry.sourceLabel } : {}),
    context: entry.context,
    stale,
  }
}

export function buildStepsReading(input: {
  available: boolean
  todayTotal: number | null
  sessionDelta: number | null
  latestRecordedAt: string | null
  sourceLabel?: string
}): RunWalkIntegracaoStepsDto {
  if (!input.available) {
    return {
      available: false,
      todayTotal: null,
      sessionDelta: null,
      recordedAt: null,
    }
  }

  return {
    available: true,
    todayTotal: input.todayTotal,
    sessionDelta:
      input.sessionDelta != null ? formatAtividadeSteps(input.sessionDelta) : null,
    recordedAt: input.latestRecordedAt,
    ...(input.sourceLabel ? { sourceLabel: input.sourceLabel } : {}),
  }
}

export function buildRunWalkIntegracoesLeiturasTempoRealDto(input: {
  integrations: PacienteMetricasIntegracaoRow[]
  heartRateRow: PacienteMetricasLeituraRow | null
  todayTotalSteps: number | null
  sessionDeltaSteps: number | null
  latestStepsRecordedAt: string | null
  stepsSourceLabel?: string
  sessionStartedAt?: string
  maxAgeSeconds: number
  fetchedAt: string
}): RunWalkIntegracoesLeiturasTempoRealDto {
  const summaries = integrationRowsToSummaries(input.integrations)
  const integrationActive = isIntegrationActiveForLiveReadings(input.integrations)
  const heartRatePermission = hasConnectedIntegrationPermission(input.integrations, 'heart-rate')
  const stepsPermission = hasConnectedIntegrationPermission(input.integrations, 'steps')

  return {
    integrationActive,
    integrations: summaries,
    heartRate: buildHeartRateReading(input.heartRateRow, {
      available: heartRatePermission,
      maxAgeSeconds: input.maxAgeSeconds,
      nowIso: input.fetchedAt,
    }),
    steps: buildStepsReading({
      available: stepsPermission,
      todayTotal: input.todayTotalSteps,
      sessionDelta: input.sessionStartedAt ? input.sessionDeltaSteps : null,
      latestRecordedAt: input.latestStepsRecordedAt,
      sourceLabel: input.stepsSourceLabel,
    }),
    fetchedAt: input.fetchedAt,
    pollIntervalMs: RUN_WALK_INTEGRACOES_LEITURAS_POLL_HINT_MS,
    limitations: RUN_WALK_INTEGRACOES_LEITURAS_LIMITATIONS,
  }
}
