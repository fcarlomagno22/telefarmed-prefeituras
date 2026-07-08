import type { IntegrationConnectionState } from '../types/healthIntegrations'

export const RUN_WALK_INTEGRATION_READINGS_POLL_MS = 10_000

export function hasActiveHealthIntegrationForLiveSession(
  connections: Record<string, IntegrationConnectionState>,
): boolean {
  return Object.values(connections).some((connection) => {
    if (connection.status !== 'connected') return false
    const permissions = connection.enabledPermissions ?? []
    return permissions.includes('heart-rate') || permissions.includes('steps')
  })
}
