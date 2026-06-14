import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/auditoria'
import * as mock from '../../mockServices/admin/auditoria'

const useApi = isBackendApiEnabled()

class MockAdminAuditoriaApiError extends Error {
  status = 0
}

export type { FetchAuditoriaResult } from '../../mockServices/admin/auditoria'

export const AdminAuditoriaApiError = useApi ? api.AdminAuditoriaApiError : MockAdminAuditoriaApiError

export const isAdminAuditoriaApiError = useApi ? api.isAdminAuditoriaApiError : () => false

export const fetchAdminAuditoria = useApi ? api.fetchAdminAuditoria : mock.fetchAdminAuditoria

export const fetchAdminAuditoriaSummary = useApi
  ? api.fetchAdminAuditoriaSummary
  : mock.fetchAdminAuditoriaSummary

export const sendAdminAuditoriaClientEvent = useApi ? api.sendAdminAuditoriaClientEvent : async () => {}
