import type { IntegracaoMetricasDto } from '../lib/api/vd/metricas'
import {
  IntegrationConnectionState,
  IntegrationConnectionStatus,
} from '../types/healthIntegrations'

const API_STATUSES = new Set<IntegrationConnectionStatus>(['connected', 'disconnected'])

function parseTimestamp(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined
  const value = Date.parse(iso)
  return Number.isFinite(value) ? value : undefined
}

export function mapIntegracaoDtoToConnectionState(
  dto: IntegracaoMetricasDto,
): IntegrationConnectionState {
  const lastSyncedAt = parseTimestamp(dto.lastSyncedAt) ?? parseTimestamp(dto.connectedAt)

  const state: IntegrationConnectionState = {
    status: API_STATUSES.has(dto.status) ? dto.status : 'disconnected',
  }

  if (dto.permissions.length > 0) {
    state.enabledPermissions = [...dto.permissions]
  }

  if (lastSyncedAt != null) {
    state.lastSyncedAt = lastSyncedAt
  }

  if (dto.connectedDeviceName) {
    state.connectedDeviceName = dto.connectedDeviceName
  }

  return state
}

export function mapIntegracoesDtoToConnectionState(
  integrations: Record<string, IntegracaoMetricasDto>,
): Record<string, IntegrationConnectionState> {
  const connections: Record<string, IntegrationConnectionState> = {}

  for (const [integrationId, dto] of Object.entries(integrations)) {
    connections[integrationId] = mapIntegracaoDtoToConnectionState(dto)
  }

  return connections
}

export function connectionStateToUpdateInput(state: IntegrationConnectionState) {
  const status = state.status === 'connected' ? 'connected' : 'disconnected'
  const permissions = state.enabledPermissions ?? []
  const syncedAtIso =
    state.lastSyncedAt != null && Number.isFinite(state.lastSyncedAt)
      ? new Date(state.lastSyncedAt).toISOString()
      : undefined

  return {
    status: status as 'connected' | 'disconnected',
    permissions,
    ...(status === 'connected' && syncedAtIso
      ? { connectedAt: syncedAtIso, lastSyncedAt: syncedAtIso }
      : {}),
    ...(state.connectedDeviceName ? { connectedDeviceName: state.connectedDeviceName } : {}),
  }
}

export function mergeConnectionState(
  connections: Record<string, IntegrationConnectionState>,
  integrationId: string,
  connection: IntegrationConnectionState,
): Record<string, IntegrationConnectionState> {
  return {
    ...connections,
    [integrationId]: connection,
  }
}
