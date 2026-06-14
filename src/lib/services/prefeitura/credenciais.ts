import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/credenciais'
import {
  PrefeituraCredenciaisApiError as MockPrefeituraCredenciaisApiError,
  activatePrefeituraGestorCredential as mockActivatePrefeituraGestorCredential,
  activatePrefeituraPortalCredential as mockActivatePrefeituraPortalCredential,
  createPrefeituraGestorCredential as mockCreatePrefeituraGestorCredential,
  createPrefeituraPortalCredential as mockCreatePrefeituraPortalCredential,
  deactivatePrefeituraGestorCredential as mockDeactivatePrefeituraGestorCredential,
  deactivatePrefeituraPortalCredential as mockDeactivatePrefeituraPortalCredential,
  deletePrefeituraGestorCredential as mockDeletePrefeituraGestorCredential,
  deletePrefeituraPortalCredential as mockDeletePrefeituraPortalCredential,
  fetchPrefeituraCredenciaisAccessLogs as mockFetchPrefeituraCredenciaisAccessLogs,
  fetchPrefeituraEntitySummary as mockFetchPrefeituraEntitySummary,
  fetchPrefeituraGestorCredentials as mockFetchPrefeituraGestorCredentials,
  fetchPrefeituraPortalCredentials as mockFetchPrefeituraPortalCredentials,
  fetchPrefeituraUbtOptions as mockFetchPrefeituraUbtOptions,
  isPrefeituraCredenciaisApiError as mockIsPrefeituraCredenciaisApiError,
  transferPrefeituraPortalCredentialUbt as mockTransferPrefeituraPortalCredentialUbt,
  updatePrefeituraGestorCredential as mockUpdatePrefeituraGestorCredential,
  updatePrefeituraPortalCredential as mockUpdatePrefeituraPortalCredential,
  verifyPrefeituraPortalResponsiblePin as mockVerifyPrefeituraPortalResponsiblePin,
  type PrefeituraCredentialsAccessLogsQuery,
} from '../../mockServices/prefeitura/credenciais'

export type { PrefeituraCredentialsAccessLogsQuery }

export const PrefeituraCredenciaisApiError = isBackendApiEnabled()
  ? api.PrefeituraCredenciaisApiError
  : MockPrefeituraCredenciaisApiError

export function isPrefeituraCredenciaisApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraCredenciaisApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraCredenciaisApiError(error)
  }
  return mockIsPrefeituraCredenciaisApiError(error)
}

export const fetchPrefeituraPortalCredentials = isBackendApiEnabled()
  ? api.apiFetchPrefeituraPortalCredentials
  : mockFetchPrefeituraPortalCredentials

export const fetchPrefeituraGestorCredentials = isBackendApiEnabled()
  ? api.apiFetchPrefeituraGestorCredentials
  : mockFetchPrefeituraGestorCredentials

export const fetchPrefeituraUbtOptions = isBackendApiEnabled()
  ? api.apiFetchPrefeituraUbtOptions
  : mockFetchPrefeituraUbtOptions

export const fetchPrefeituraEntitySummary = isBackendApiEnabled()
  ? api.apiFetchPrefeituraEntitySummary
  : mockFetchPrefeituraEntitySummary

export const createPrefeituraPortalCredential = isBackendApiEnabled()
  ? api.apiCreatePrefeituraPortalCredential
  : mockCreatePrefeituraPortalCredential

export const updatePrefeituraPortalCredential = isBackendApiEnabled()
  ? api.apiUpdatePrefeituraPortalCredential
  : mockUpdatePrefeituraPortalCredential

export const deactivatePrefeituraPortalCredential = isBackendApiEnabled()
  ? api.apiDeactivatePrefeituraPortalCredential
  : mockDeactivatePrefeituraPortalCredential

export const activatePrefeituraPortalCredential = isBackendApiEnabled()
  ? api.apiActivatePrefeituraPortalCredential
  : mockActivatePrefeituraPortalCredential

export const deletePrefeituraPortalCredential = isBackendApiEnabled()
  ? api.apiDeletePrefeituraPortalCredential
  : mockDeletePrefeituraPortalCredential

export const transferPrefeituraPortalCredentialUbt = isBackendApiEnabled()
  ? api.apiTransferPrefeituraPortalCredentialUbt
  : mockTransferPrefeituraPortalCredentialUbt

export const verifyPrefeituraPortalResponsiblePin = isBackendApiEnabled()
  ? api.apiVerifyPrefeituraPortalResponsiblePin
  : mockVerifyPrefeituraPortalResponsiblePin

export const createPrefeituraGestorCredential = isBackendApiEnabled()
  ? api.apiCreatePrefeituraGestorCredential
  : mockCreatePrefeituraGestorCredential

export const updatePrefeituraGestorCredential = isBackendApiEnabled()
  ? api.apiUpdatePrefeituraGestorCredential
  : mockUpdatePrefeituraGestorCredential

export const deactivatePrefeituraGestorCredential = isBackendApiEnabled()
  ? api.apiDeactivatePrefeituraGestorCredential
  : mockDeactivatePrefeituraGestorCredential

export const activatePrefeituraGestorCredential = isBackendApiEnabled()
  ? api.apiActivatePrefeituraGestorCredential
  : mockActivatePrefeituraGestorCredential

export const deletePrefeituraGestorCredential = isBackendApiEnabled()
  ? api.apiDeletePrefeituraGestorCredential
  : mockDeletePrefeituraGestorCredential

export const fetchPrefeituraCredenciaisAccessLogs = isBackendApiEnabled()
  ? api.apiFetchPrefeituraCredenciaisAccessLogs
  : mockFetchPrefeituraCredenciaisAccessLogs
