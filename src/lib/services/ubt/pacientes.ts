import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/pacientes'
import {
  UbtPacientesApiError as MockUbtPacientesApiError,
  createUbtPacienteAnotacao as mockCreateUbtPacienteAnotacao,
  createUbtPacienteApi as mockCreateUbtPacienteApi,
  createUbtPacienteRegistroContato as mockCreateUbtPacienteRegistroContato,
  fetchUbtPacienteAnotacoes as mockFetchUbtPacienteAnotacoes,
  fetchUbtPacienteConsultas as mockFetchUbtPacienteConsultas,
  fetchUbtPacienteContatosRegistrados as mockFetchUbtPacienteContatosRegistrados,
  fetchUbtPacienteDetail as mockFetchUbtPacienteDetail,
  fetchUbtPacienteRow as mockFetchUbtPacienteRow,
  fetchUbtPacientesFiltros as mockFetchUbtPacientesFiltros,
  fetchUbtPatientTerritoryPolicy as mockFetchUbtPatientTerritoryPolicy,
  fetchUbtPacientesRows as mockFetchUbtPacientesRows,
  fetchUbtPacientesSummary as mockFetchUbtPacientesSummary,
  inactivateUbtPacienteApi as mockInactivateUbtPacienteApi,
  isUbtPacientesApiError as mockIsUbtPacientesApiError,
  lookupUbtPatientForTriage as mockLookupUbtPatientForTriage,
  registerUbtCompletedPatient as mockRegisterUbtCompletedPatient,
  updateUbtPacienteApi as mockUpdateUbtPacienteApi,
  type ListUbtPacientesParams,
  type UbtPacientesFiltrosResponse,
  type UbtPacientesListResponse,
  type UbtPatientTerritoryPolicy,
} from '../../mockServices/ubt/pacientes'
import type { networkUsersSummary, NetworkUsersAbout } from '../../../data/networkUsersMock'
import type { PatientLookupContext, PatientLookupResult } from '../../../types/patientLookup'
import type { PatientRegistration } from '../../../types/attendance'
import type { NetworkUser } from '../../../data/networkUsersMock'
import {
  isPacientePhotoDataUrl,
  stripPacientePhotoDataUrl,
} from '../../../utils/ubtPacientePhoto'

const useApi = isBackendApiEnabled()

async function finalizeUbtPatientRegistration(
  accessToken: string,
  registration: PatientRegistration,
  existingPatientId: string | undefined,
  saved: NetworkUser,
): Promise<NetworkUser> {
  let patient = saved
  const photoDataUrl = registration.photoDataUrl

  if (useApi && isPacientePhotoDataUrl(photoDataUrl)) {
    patient = await api.apiUploadUbtPacienteFoto(accessToken, patient.id, photoDataUrl!)
  }

  if (useApi) {
    patient = await api.apiLinkUbtPacienteVinculo(accessToken, patient.id)
  }

  return patient
}

async function registerUbtPatientWithPostSteps(
  accessToken: string,
  registration: PatientRegistration,
  existingPatientId?: string,
): Promise<NetworkUser> {
  const photoDataUrl = registration.photoDataUrl
  const payload = stripPacientePhotoDataUrl(registration)

  if (useApi) {
    const saved = await api.apiRegisterUbtCompletedPatient(
      accessToken,
      payload,
      existingPatientId,
    )
    return finalizeUbtPatientRegistration(
      accessToken,
      { ...registration, photoDataUrl },
      existingPatientId,
      saved,
    )
  }

  const saved = await mockRegisterUbtCompletedPatient(accessToken, registration, existingPatientId)
  return saved
}

export type {
  ListUbtPacientesParams,
  UbtPacientesFiltrosResponse,
  UbtPacientesListResponse,
  UbtPatientTerritoryPolicy,
}

export const UbtPacientesApiError = useApi ? api.UbtPacientesApiError : MockUbtPacientesApiError

export const isUbtPacientesApiError = useApi
  ? (error: unknown): error is api.UbtPacientesApiError => error instanceof api.UbtPacientesApiError
  : mockIsUbtPacientesApiError

export async function lookupUbtPatientForTriage(
  accessToken: string,
  cpf: string,
  context?: PatientLookupContext,
): Promise<PatientLookupResult> {
  if (useApi) return api.apiLookupUbtPatient(accessToken, cpf, context)
  return mockLookupUbtPatientForTriage(accessToken, cpf, context)
}

export async function registerUbtCompletedPatient(
  accessToken: string,
  registration: PatientRegistration,
  existingPatientId?: string,
): Promise<NetworkUser> {
  return registerUbtPatientWithPostSteps(accessToken, registration, existingPatientId)
}

export async function createUbtPacienteApi(
  accessToken: string,
  registration: PatientRegistration,
): Promise<NetworkUser> {
  return registerUbtPatientWithPostSteps(accessToken, registration)
}

export async function updateUbtPacienteApi(
  accessToken: string,
  id: string,
  registration: PatientRegistration,
): Promise<NetworkUser> {
  if (useApi) return api.apiUpdateUbtPaciente(accessToken, id, registration)
  return mockUpdateUbtPacienteApi(accessToken, id, registration)
}

export async function linkUbtPacienteVinculo(
  accessToken: string,
  pacienteId: string,
): Promise<NetworkUser> {
  if (!useApi) {
    throw new MockUbtPacientesApiError('Vínculo UBT via API não disponível no modo mock.', 501)
  }
  return api.apiLinkUbtPacienteVinculo(accessToken, pacienteId)
}

export async function uploadUbtPacienteFoto(
  accessToken: string,
  pacienteId: string,
  photoDataUrl: string,
): Promise<NetworkUser> {
  if (!useApi) {
    throw new MockUbtPacientesApiError('Upload de foto via API não disponível no modo mock.', 501)
  }
  return api.apiUploadUbtPacienteFoto(accessToken, pacienteId, photoDataUrl)
}

export async function fetchUbtPacienteDetailApi(accessToken: string, id: string) {
  if (useApi) return api.apiFetchUbtPacienteDetail(accessToken, id)
  return mockFetchUbtPacienteDetail(accessToken, id)
}

export async function fetchUbtPacientesSummary(
  accessToken: string,
): Promise<{ summary: typeof networkUsersSummary; about: NetworkUsersAbout }> {
  if (useApi) return api.apiFetchUbtPacientesSummary(accessToken)
  return mockFetchUbtPacientesSummary(accessToken)
}

export async function fetchUbtPacientesFiltros(accessToken: string) {
  if (useApi) return api.apiFetchUbtPacientesFiltros(accessToken)
  return mockFetchUbtPacientesFiltros(accessToken)
}

export async function fetchUbtPatientTerritoryPolicy(accessToken: string) {
  if (useApi) return api.apiFetchUbtPatientTerritoryPolicy(accessToken)
  return mockFetchUbtPatientTerritoryPolicy(accessToken)
}

export async function fetchUbtPacientesRows(
  accessToken: string,
  params: ListUbtPacientesParams = {},
) {
  if (useApi) return api.apiFetchUbtPacientesRows(accessToken, params)
  return mockFetchUbtPacientesRows(accessToken, params)
}

export async function fetchUbtPacienteRow(accessToken: string, id: string) {
  if (useApi) return api.apiFetchUbtPacienteRow(accessToken, id)
  return mockFetchUbtPacienteRow(accessToken, id)
}

export async function fetchUbtPacienteDetail(accessToken: string, id: string) {
  return fetchUbtPacienteDetailApi(accessToken, id)
}

export async function fetchUbtPacienteConsultas(accessToken: string, pacienteId: string) {
  if (useApi) return api.apiFetchUbtPacienteConsultas(accessToken, pacienteId)
  return mockFetchUbtPacienteConsultas(accessToken, pacienteId)
}

export async function fetchUbtPacienteAnotacoes(accessToken: string, pacienteId: string) {
  if (useApi) return api.apiFetchUbtPacienteAnotacoes(accessToken, pacienteId)
  return mockFetchUbtPacienteAnotacoes(accessToken, pacienteId)
}

export async function createUbtPacienteAnotacao(
  accessToken: string,
  pacienteId: string,
  text: string,
) {
  if (useApi) return api.apiCreateUbtPacienteAnotacao(accessToken, pacienteId, text)
  return mockCreateUbtPacienteAnotacao(accessToken, pacienteId, text)
}

export async function fetchUbtPacienteContatosRegistrados(
  accessToken: string,
  pacienteId: string,
) {
  if (useApi) return api.apiFetchUbtPacienteContatosRegistrados(accessToken, pacienteId)
  return mockFetchUbtPacienteContatosRegistrados(accessToken, pacienteId)
}

export async function createUbtPacienteRegistroContato(
  accessToken: string,
  pacienteId: string,
  body: {
    channel: 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'
    phone?: string
    note: string
  },
) {
  if (useApi) return api.apiCreateUbtPacienteRegistroContato(accessToken, pacienteId, body)
  return mockCreateUbtPacienteRegistroContato(accessToken, pacienteId, body)
}

export async function inactivateUbtPacienteApi(accessToken: string, pacienteId: string) {
  if (useApi) return api.apiInactivateUbtPaciente(accessToken, pacienteId)
  return mockInactivateUbtPacienteApi(accessToken, pacienteId)
}

export {
  mapUbtDetailToPatientRegistration,
  mapPatientRegistrationToUbtPayload,
} from '../../mockServices/ubt/pacientes'

export type { UbtPacienteRegistrationDetail } from '../../mockServices/ubt/pacientes'
