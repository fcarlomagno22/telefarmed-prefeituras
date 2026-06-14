import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/consultas'
import type { ConsultasFilters } from '../../../utils/consultasFilters'
import {
  UbtConsultasApiError as MockUbtConsultasApiError,
  fetchUbtConsultasList as mockFetchUbtConsultasList,
  fetchUbtConsultasOverview as mockFetchUbtConsultasOverview,
  iniciarUbtConsulta as mockIniciarUbtConsulta,
  isUbtConsultasApiError as mockIsUbtConsultasApiError,
  registrarUbtConsultaAvaliacao as mockRegistrarUbtConsultaAvaliacao,
  type UbtConsultasOverviewApi,
} from '../../mockServices/ubt/consultas'
import { entrarPublicSalaEspera as mockEntrarPublicSalaEspera } from '../../mockServices/ubt/publicAtendimento'

const useApi = isBackendApiEnabled()

export const UbtConsultasApiError = useApi ? api.UbtConsultasApiError : MockUbtConsultasApiError

export const isUbtConsultasApiError = useApi
  ? (error: unknown): error is api.UbtConsultasApiError =>
      error instanceof api.UbtConsultasApiError
  : mockIsUbtConsultasApiError

export type { UbtConsultasOverviewApi }

function toApiFilters(filters: ConsultasFilters): api.UbtConsultasListParams {
  return {
    periodStart: filters.periodStart,
    periodEnd: filters.periodEnd,
    specialty: filters.specialty || undefined,
    doctor: filters.doctor || undefined,
    neighborhood: filters.neighborhood || undefined,
    gender: filters.gender || undefined,
    ageRange: filters.ageRange || undefined,
    status: filters.status || undefined,
    generalSearch: filters.generalSearch || undefined,
  }
}

export async function fetchUbtConsultasOverview(
  accessToken: string,
  periodStart: string,
  periodEnd: string,
) {
  if (useApi) {
    return api.apiFetchUbtConsultasOverview(accessToken, periodStart, periodEnd)
  }
  return mockFetchUbtConsultasOverview(accessToken, periodStart, periodEnd)
}

export async function fetchUbtConsultasList(
  accessToken: string,
  filters: ConsultasFilters,
  page: number,
  pageSize: number,
) {
  if (useApi) {
    return api.apiFetchUbtConsultasList(accessToken, toApiFilters(filters), page, pageSize)
  }
  return mockFetchUbtConsultasList(accessToken, filters, page, pageSize)
}

export async function iniciarUbtConsulta(
  accessToken: string,
  body: {
    codigoAtendimento: string
    pacienteId: string
    especialidadeId: string
    filaEsperaId?: string
    agendaConsultaId?: string
    profissionalId?: string
    tipo?: 'consulta' | 'retorno' | 'primeira_consulta'
    triagemResumo?: string
  },
) {
  if (useApi) {
    return api.apiIniciarUbtConsulta(accessToken, body)
  }
  return mockIniciarUbtConsulta(accessToken, body)
}

export async function entrarUbtSalaEspera(accessToken: string, codigoAtendimento: string) {
  if (useApi) {
    return api.apiEntrarUbtSalaEspera(accessToken, codigoAtendimento)
  }
  return mockEntrarPublicSalaEspera(codigoAtendimento)
}

export async function sairUbtSalaEspera(accessToken: string, codigoAtendimento: string) {
  if (useApi) {
    await api.apiSairUbtSalaEspera(accessToken, codigoAtendimento)
    return
  }
  void accessToken
  void codigoAtendimento
}

export async function registrarUbtConsultaAvaliacao(
  accessToken: string,
  codigoAtendimento: string,
  nota: number,
  comentario?: string,
) {
  if (useApi) {
    return api.apiRegistrarUbtConsultaAvaliacao(accessToken, codigoAtendimento, nota, comentario)
  }
  return mockRegistrarUbtConsultaAvaliacao(accessToken, codigoAtendimento, nota, comentario)
}
