import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/triagem'
import {
  UbtTriagemApiError as MockUbtTriagemApiError,
  checkInUbtFila as mockCheckInUbtFila,
  chamarUbtFilaPaciente as mockChamarUbtFilaPaciente,
  chamarUbtFilaProximo as mockChamarUbtFilaProximo,
  fetchUbtFilaLive as mockFetchUbtFilaLive,
  fetchUbtTriagemEspecialidadeCatalog as mockFetchUbtTriagemEspecialidadeCatalog,
  isUbtTriagemApiError as mockIsUbtTriagemApiError,
  updateUbtFilaStatus as mockUpdateUbtFilaStatus,
  type FilaStatusUpdate,
  type UbtTriagemEspecialidadeCatalog,
} from '../../mockServices/ubt/triagem'
import type { UbtDashboardOverview } from '../../../types/ubtDashboard'
import { fetchUbtDashboardOverview as mockFetchUbtDashboardOverview } from '../../mockServices/ubt/dashboard'

const useApi = isBackendApiEnabled()

export type { UbtTriagemEspecialidadeCatalog, FilaStatusUpdate }

export const UbtTriagemApiError = useApi ? api.UbtTriagemApiError : MockUbtTriagemApiError

export const isUbtTriagemApiError = useApi
  ? (error: unknown): error is api.UbtTriagemApiError => error instanceof api.UbtTriagemApiError
  : mockIsUbtTriagemApiError

export async function fetchUbtTriagemEspecialidadeCatalog(accessToken: string, date?: string) {
  if (useApi) return api.apiFetchUbtTriagemEspecialidadeCatalog(accessToken, date)
  return mockFetchUbtTriagemEspecialidadeCatalog(accessToken, date)
}

export async function fetchUbtFilaLive(accessToken: string) {
  if (useApi) return api.apiFetchUbtFilaLive(accessToken)
  return mockFetchUbtFilaLive(accessToken)
}

export async function checkInUbtFila(accessToken: string, agendaConsultaId: string) {
  if (useApi) return api.apiCheckInUbtFila(accessToken, agendaConsultaId)
  return mockCheckInUbtFila(accessToken, agendaConsultaId)
}

export async function chamarUbtFilaPaciente(accessToken: string, filaId: string) {
  if (useApi) return api.apiChamarUbtFilaPaciente(accessToken, filaId)
  return mockChamarUbtFilaPaciente(accessToken, filaId)
}

export async function chamarUbtFilaProximo(accessToken: string) {
  if (useApi) return api.apiChamarUbtFilaProximo(accessToken)
  return mockChamarUbtFilaProximo(accessToken)
}

export async function updateUbtFilaStatus(
  accessToken: string,
  filaId: string,
  status: FilaStatusUpdate,
) {
  if (useApi) return api.apiUpdateUbtFilaStatus(accessToken, filaId, status)
  return mockUpdateUbtFilaStatus(accessToken, filaId, status)
}

export async function fetchUbtTriagemDashboard(accessToken: string): Promise<UbtDashboardOverview> {
  if (useApi) {
    const dashboard = await api.apiFetchUbtTriagemDashboard(accessToken)
    return {
      ...dashboard,
      consultasHoje: dashboard.consultasHoje ?? [],
    }
  }
  return mockFetchUbtDashboardOverview(accessToken)
}
