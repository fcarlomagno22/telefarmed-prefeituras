import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/portal/auditoria'
import * as mockPrefeitura from '../../mockServices/prefeitura/auditoria'
import * as mockUbt from '../../mockServices/ubt/auditoria'

const useApi = isBackendApiEnabled()

export type PortalAuditoriaVariant = 'prefeitura' | 'ubt'

export type { FetchAuditoriaResult } from '../../mockServices/prefeitura/auditoria'

export const PortalAuditoriaApiError = useApi
  ? api.PortalAuditoriaApiError
  : class extends Error {}

export function isPortalAuditoriaApiError(error: unknown): boolean {
  if (useApi) return api.isPortalAuditoriaApiError(error)
  return false
}

export async function fetchPortalAuditoria(
  variant: PortalAuditoriaVariant,
  accessToken: string,
  params: import('../../../types/auditLogs').ListAuditoriaParams = {},
) {
  if (useApi) return api.fetchPortalAuditoria(variant, accessToken, params)
  if (variant === 'prefeitura') return mockPrefeitura.fetchPrefeituraAuditoria(accessToken, params)
  return mockUbt.fetchUbtAuditoria(accessToken, params)
}

export async function fetchPortalAuditoriaSummary(
  variant: PortalAuditoriaVariant,
  accessToken: string,
  params: Pick<import('../../../types/auditLogs').ListAuditoriaParams, 'from' | 'to' | 'portal'> = {},
) {
  if (useApi) return api.fetchPortalAuditoriaSummary(variant, accessToken, params)
  if (variant === 'prefeitura') {
    return mockPrefeitura.fetchPrefeituraAuditoriaSummary(accessToken)
  }
  return mockUbt.fetchUbtAuditoriaSummary(accessToken)
}

export async function sendPortalAuditoriaClientEvent(
  variant: api.PortalAuditoriaVariant,
  accessToken: string,
  input: Parameters<typeof api.sendPortalAuditoriaClientEvent>[2],
) {
  if (!useApi) return
  await api.sendPortalAuditoriaClientEvent(variant, accessToken, input)
}
