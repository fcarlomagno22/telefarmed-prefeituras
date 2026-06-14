import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/agendas'
import {
  PrefeituraAgendasApiError as MockPrefeituraAgendasApiError,
  fetchPrefeituraAgendaCatalog as mockFetchPrefeituraAgendaCatalog,
  fetchPrefeituraAgendaDay as mockFetchPrefeituraAgendaDay,
  fetchPrefeituraAgendaFuture as mockFetchPrefeituraAgendaFuture,
  fetchPrefeituraAgendaWeek as mockFetchPrefeituraAgendaWeek,
  isPrefeituraAgendasApiError as mockIsPrefeituraAgendasApiError,
  mapDayAppointmentStatus as mockMapDayAppointmentStatus,
  type PrefeituraAgendaCatalogApi,
  type PrefeituraAgendaDayApi,
  type PrefeituraAgendaFutureApi,
  type PrefeituraAgendaUnitApi,
  type PrefeituraAgendaWeekApi,
} from '../../mockServices/prefeitura/agendas'

export type {
  PrefeituraAgendaCatalogApi,
  PrefeituraAgendaDayApi,
  PrefeituraAgendaFutureApi,
  PrefeituraAgendaUnitApi,
  PrefeituraAgendaWeekApi,
}

export const PrefeituraAgendasApiError = isBackendApiEnabled()
  ? api.PrefeituraAgendasApiError
  : MockPrefeituraAgendasApiError

export function isPrefeituraAgendasApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraAgendasApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraAgendasApiError(error)
  }
  return mockIsPrefeituraAgendasApiError(error)
}

export const fetchPrefeituraAgendaCatalog = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAgendaCatalog
  : mockFetchPrefeituraAgendaCatalog

export const fetchPrefeituraAgendaWeek = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAgendaWeek
  : mockFetchPrefeituraAgendaWeek

export const fetchPrefeituraAgendaDay = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAgendaDay
  : mockFetchPrefeituraAgendaDay

export const fetchPrefeituraAgendaFuture = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAgendaFuture
  : mockFetchPrefeituraAgendaFuture

export const mapDayAppointmentStatus = isBackendApiEnabled()
  ? api.mapDayAppointmentStatus
  : mockMapDayAppointmentStatus
