import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/pacientes'
import {
  PrefeituraPacientesApiError as MockPrefeituraPacientesApiError,
  createPrefeituraPacienteAnotacao as mockCreatePrefeituraPacienteAnotacao,
  createPrefeituraPacienteRegistroContato as mockCreatePrefeituraPacienteRegistroContato,
  fetchPrefeituraPacienteAnotacoes as mockFetchPrefeituraPacienteAnotacoes,
  fetchPrefeituraPacienteById as mockFetchPrefeituraPacienteById,
  fetchPrefeituraPacienteContatosRegistrados as mockFetchPrefeituraPacienteContatosRegistrados,
  fetchPrefeituraPacientesFiltros as mockFetchPrefeituraPacientesFiltros,
  fetchPrefeituraPacientesRows as mockFetchPrefeituraPacientesRows,
  fetchPrefeituraPacientesSummary as mockFetchPrefeituraPacientesSummary,
  isPrefeituraPacientesApiError as mockIsPrefeituraPacientesApiError,
  type ListPrefeituraPacientesParams,
  type PrefeituraPacientesFiltrosResponse,
  type PrefeituraPacientesListResponse,
  type PrefeituraPacientesSummaryResponse,
} from '../../mockServices/prefeitura/pacientes'
import type { PrefeituraMunicipalPatientsAbout } from '../../../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatient } from '../../../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatientDetail } from '../../../types/prefeituraPacientes'

export type {
  ListPrefeituraPacientesParams,
  PrefeituraPacientesFiltrosResponse,
  PrefeituraPacientesListResponse,
  PrefeituraPacientesSummaryResponse,
}

export type CreatePrefeituraPacientePayload = api.CreatePrefeituraPacientePayload
export type UpdatePrefeituraPacientePayload = api.UpdatePrefeituraPacientePayload

export type { UpdatePacientePayload } from '../admin/pacientes'

const useApi = isBackendApiEnabled()

export const PrefeituraPacientesApiError = useApi
  ? api.PrefeituraPacientesApiError
  : MockPrefeituraPacientesApiError

export const isPrefeituraPacientesApiError = useApi
  ? (error: unknown): error is api.PrefeituraPacientesApiError =>
      error instanceof api.PrefeituraPacientesApiError
  : mockIsPrefeituraPacientesApiError

export async function fetchPrefeituraPacientesSummary(
  accessToken: string,
): Promise<{ summary: PrefeituraPacientesSummaryResponse; about: PrefeituraMunicipalPatientsAbout }> {
  if (useApi) return api.apiFetchPrefeituraPacientesSummary(accessToken)
  return mockFetchPrefeituraPacientesSummary(accessToken)
}

export async function fetchPrefeituraPacientesFiltros(
  accessToken: string,
): Promise<PrefeituraPacientesFiltrosResponse> {
  if (useApi) return api.apiFetchPrefeituraPacientesFiltros(accessToken)
  return mockFetchPrefeituraPacientesFiltros(accessToken)
}

export async function fetchPrefeituraPacientesRows(
  accessToken: string,
  params: ListPrefeituraPacientesParams = {},
): Promise<PrefeituraPacientesListResponse> {
  if (useApi) return api.apiFetchPrefeituraPacientesRows(accessToken, params)
  return mockFetchPrefeituraPacientesRows(accessToken, params)
}

export async function fetchPrefeituraPacienteById(
  accessToken: string,
  id: string,
): Promise<PrefeituraMunicipalPatientDetail> {
  if (useApi) return api.apiFetchPrefeituraPacienteById(accessToken, id)
  return mockFetchPrefeituraPacienteById(accessToken, id)
}

export async function createPrefeituraPaciente(
  accessToken: string,
  payload: CreatePrefeituraPacientePayload,
): Promise<PrefeituraMunicipalPatient> {
  if (!useApi) {
    throw new MockPrefeituraPacientesApiError(
      'Cadastro de paciente via API não disponível no modo mock.',
      501,
    )
  }
  return api.apiCreatePrefeituraPaciente(accessToken, payload)
}

export async function updatePrefeituraPaciente(
  accessToken: string,
  id: string,
  payload: UpdatePrefeituraPacientePayload,
): Promise<PrefeituraMunicipalPatientDetail> {
  if (!useApi) {
    throw new MockPrefeituraPacientesApiError(
      'Atualização de paciente via API não disponível no modo mock.',
      501,
    )
  }
  return api.apiUpdatePrefeituraPaciente(accessToken, id, payload)
}

export type PrefeituraPacienteAnnotation = api.PrefeituraPacienteAnnotation
export type PrefeituraPacienteContactLog = api.PrefeituraPacienteContactLog

export async function fetchPrefeituraPacienteAnotacoes(accessToken: string, pacienteId: string) {
  if (useApi) return api.apiFetchPrefeituraPacienteAnotacoes(accessToken, pacienteId)
  return mockFetchPrefeituraPacienteAnotacoes(accessToken, pacienteId)
}

export async function createPrefeituraPacienteAnotacao(
  accessToken: string,
  pacienteId: string,
  text: string,
) {
  if (useApi) return api.apiCreatePrefeituraPacienteAnotacao(accessToken, pacienteId, text)
  return mockCreatePrefeituraPacienteAnotacao(accessToken, pacienteId, text)
}

export async function fetchPrefeituraPacienteContatosRegistrados(
  accessToken: string,
  pacienteId: string,
) {
  if (useApi) return api.apiFetchPrefeituraPacienteContatosRegistrados(accessToken, pacienteId)
  return mockFetchPrefeituraPacienteContatosRegistrados(accessToken, pacienteId)
}

export async function createPrefeituraPacienteRegistroContato(
  accessToken: string,
  pacienteId: string,
  body: {
    channel: PrefeituraPacienteContactLog['channel']
    phone?: string
    note: string
  },
) {
  if (useApi) return api.apiCreatePrefeituraPacienteRegistroContato(accessToken, pacienteId, body)
  return mockCreatePrefeituraPacienteRegistroContato(accessToken, pacienteId, body)
}
