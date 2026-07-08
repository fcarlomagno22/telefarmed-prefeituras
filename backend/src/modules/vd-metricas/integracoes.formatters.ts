import type { IntegracaoMetricasDto, PacienteMetricasIntegracaoRow } from './types.js'

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function parseIntegracaoPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export function rowToIntegracaoMetricasDto(
  row: PacienteMetricasIntegracaoRow,
): IntegracaoMetricasDto {
  const metadata = row.metadata ?? {}
  const lastSyncedAt = readMetadataString(metadata, 'lastSyncedAt')
  const connectedDeviceName = readMetadataString(metadata, 'connectedDeviceName')

  return {
    status: row.status,
    permissions: parseIntegracaoPermissions(row.permissions),
    connectedAt: row.conectado_em,
    ...(lastSyncedAt ? { lastSyncedAt } : {}),
    ...(connectedDeviceName ? { connectedDeviceName } : {}),
  }
}

export function buildIntegracoesRecord(
  rows: PacienteMetricasIntegracaoRow[],
): Record<string, IntegracaoMetricasDto> {
  const integrations: Record<string, IntegracaoMetricasDto> = {}

  for (const row of rows) {
    integrations[row.integration_id] = rowToIntegracaoMetricasDto(row)
  }

  return integrations
}
