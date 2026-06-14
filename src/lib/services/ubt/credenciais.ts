import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/credenciais'
import { apiVerifyUbtAuthorizationPin } from '../../api/ubt/auth'
import {
  UbtCredenciaisApiError as MockUbtCredenciaisApiError,
  activateUbtPortalCredential as mockActivateUbtPortalCredential,
  createUbtPortalCredential as mockCreateUbtPortalCredential,
  deactivateUbtPortalCredential as mockDeactivateUbtPortalCredential,
  deleteUbtPortalCredential as mockDeleteUbtPortalCredential,
  fetchUbtCredenciaisAccessLogs as mockFetchUbtCredenciaisAccessLogs,
  fetchUbtPortalCredentialById as mockFetchUbtPortalCredentialById,
  fetchUbtPortalCredentials as mockFetchUbtPortalCredentials,
  isUbtCredenciaisApiError as mockIsUbtCredenciaisApiError,
  updateUbtPortalCredential as mockUpdateUbtPortalCredential,
  verifyUbtPortalResponsiblePin as mockVerifyUbtPortalResponsiblePin,
  type UbtCredentialsAccessLogsQuery,
  type UbtCredentialsListQuery,
} from '../../mockServices/ubt/credenciais'

export type { UbtCredentialsAccessLogsQuery, UbtCredentialsListQuery }

export const UbtCredenciaisApiError = isBackendApiEnabled()
  ? api.UbtCredenciaisApiError
  : MockUbtCredenciaisApiError

export function isUbtCredenciaisApiError(
  error: unknown,
): error is InstanceType<typeof UbtCredenciaisApiError> {
  if (isBackendApiEnabled()) {
    return api.isUbtCredenciaisApiError(error)
  }
  return mockIsUbtCredenciaisApiError(error)
}

export const fetchUbtPortalCredentials = isBackendApiEnabled()
  ? api.apiFetchUbtPortalCredentials
  : mockFetchUbtPortalCredentials

export const fetchUbtPortalCredentialById = isBackendApiEnabled()
  ? api.apiFetchUbtPortalCredentialById
  : mockFetchUbtPortalCredentialById

export const fetchUbtCredenciaisAccessLogs = isBackendApiEnabled()
  ? api.apiFetchUbtCredenciaisAccessLogs
  : mockFetchUbtCredenciaisAccessLogs

export const createUbtPortalCredential = isBackendApiEnabled()
  ? api.apiCreateUbtPortalCredential
  : mockCreateUbtPortalCredential

export const updateUbtPortalCredential = isBackendApiEnabled()
  ? api.apiUpdateUbtPortalCredential
  : mockUpdateUbtPortalCredential

export const deactivateUbtPortalCredential = isBackendApiEnabled()
  ? api.apiDeactivateUbtPortalCredential
  : mockDeactivateUbtPortalCredential

export const activateUbtPortalCredential = isBackendApiEnabled()
  ? api.apiActivateUbtPortalCredential
  : mockActivateUbtPortalCredential

export const deleteUbtPortalCredential = isBackendApiEnabled()
  ? api.apiDeleteUbtPortalCredential
  : mockDeleteUbtPortalCredential

export async function verifyUbtPortalResponsiblePin(accessToken: string, pin: string): Promise<void> {
  if (isBackendApiEnabled()) {
    await apiVerifyUbtAuthorizationPin(accessToken, pin)
    return
  }
  return mockVerifyUbtPortalResponsiblePin(accessToken, pin)
}
