import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/agenda'
import {
  UbtAgendaApiError as MockUbtAgendaApiError,
  cancelUbtAgendaConsulta as mockCancelUbtAgendaConsulta,
  confirmUbtAgendaRecepcao as mockConfirmUbtAgendaRecepcao,
  createUbtAgendaConsulta as mockCreateUbtAgendaConsulta,
  createUbtAgendaWalkIn as mockCreateUbtAgendaWalkIn,
  fetchUbtAgendaDay as mockFetchUbtAgendaDay,
  fetchUbtAgendaDoctorOverview as mockFetchUbtAgendaDoctorOverview,
  fetchUbtAgendaDoctorShifts as mockFetchUbtAgendaDoctorShifts,
  fetchUbtAgendaDoctorSlots as mockFetchUbtAgendaDoctorSlots,
  fetchUbtAgendaHistory as mockFetchUbtAgendaHistory,
  fetchUbtAgendaMedicos as mockFetchUbtAgendaMedicos,
  fetchUbtAgendaMonthIndicators as mockFetchUbtAgendaMonthIndicators,
  fetchUbtAgendaSpecialtyAvailability as mockFetchUbtAgendaSpecialtyAvailability,
  fetchUbtAgendaSpecialtySlotCount as mockFetchUbtAgendaSpecialtySlotCount,
  fetchUbtAgendaWeek as mockFetchUbtAgendaWeek,
  isUbtAgendaApiError as mockIsUbtAgendaApiError,
  markUbtAgendaFalta as mockMarkUbtAgendaFalta,
  updateUbtAgendaConsulta as mockUpdateUbtAgendaConsulta,
  type UbtAgendaDoctorShiftApi,
  type UbtAgendaSpecialtyAvailability,
} from '../../mockServices/ubt/agenda'

const useApi = isBackendApiEnabled()

export type { UbtAgendaDoctorShiftApi, UbtAgendaSpecialtyAvailability }

export const UbtAgendaApiError = useApi ? api.UbtAgendaApiError : MockUbtAgendaApiError

export const isUbtAgendaApiError = useApi
  ? (error: unknown): error is api.UbtAgendaApiError => error instanceof api.UbtAgendaApiError
  : mockIsUbtAgendaApiError

export async function fetchUbtAgendaDay(accessToken: string, date: string) {
  if (useApi) return api.apiFetchUbtAgendaDay(accessToken, date)
  return mockFetchUbtAgendaDay(accessToken, date)
}

export async function fetchUbtAgendaWeek(accessToken: string, from: string, to: string) {
  if (useApi) return api.apiFetchUbtAgendaWeek(accessToken, from, to)
  return mockFetchUbtAgendaWeek(accessToken, from, to)
}

export async function fetchUbtAgendaMonthIndicators(
  accessToken: string,
  year: number,
  month: number,
) {
  if (useApi) return api.apiFetchUbtAgendaMonthIndicators(accessToken, year, month)
  return mockFetchUbtAgendaMonthIndicators(accessToken, year, month)
}

export async function fetchUbtAgendaHistory(accessToken: string, date: string, count = 3) {
  if (useApi) return api.apiFetchUbtAgendaHistory(accessToken, date, count)
  return mockFetchUbtAgendaHistory(accessToken, date, count)
}

export async function fetchUbtAgendaMedicos(
  accessToken: string,
  params?: { specialtyId?: string; date?: string },
) {
  if (useApi) return api.apiFetchUbtAgendaMedicos(accessToken, params)
  return mockFetchUbtAgendaMedicos(accessToken, params)
}

export async function fetchUbtAgendaDoctorSlots(
  accessToken: string,
  doctorId: string,
  date: string,
) {
  if (useApi) return api.apiFetchUbtAgendaDoctorSlots(accessToken, doctorId, date)
  return mockFetchUbtAgendaDoctorSlots(accessToken, doctorId, date)
}

export async function fetchUbtAgendaDoctorOverview(
  accessToken: string,
  doctorId: string,
  from: string,
  days = 31,
) {
  if (useApi) return api.apiFetchUbtAgendaDoctorOverview(accessToken, doctorId, from, days)
  return mockFetchUbtAgendaDoctorOverview(accessToken, doctorId, from, days)
}

export async function fetchUbtAgendaSpecialtySlotCount(
  accessToken: string,
  specialtyId: string,
  date: string,
) {
  if (useApi) return api.apiFetchUbtAgendaSpecialtySlotCount(accessToken, specialtyId, date)
  return mockFetchUbtAgendaSpecialtySlotCount(accessToken, specialtyId, date)
}

export async function fetchUbtAgendaSpecialtyAvailability(accessToken: string, date: string) {
  if (useApi) return api.apiFetchUbtAgendaSpecialtyAvailability(accessToken, date)
  return mockFetchUbtAgendaSpecialtyAvailability(accessToken, date)
}

export async function fetchUbtAgendaDoctorShifts(accessToken: string, date: string) {
  if (useApi) return api.apiFetchUbtAgendaDoctorShifts(accessToken, date)
  return mockFetchUbtAgendaDoctorShifts(accessToken, date)
}

export async function createUbtAgendaConsulta(
  accessToken: string,
  payload: Parameters<typeof mockCreateUbtAgendaConsulta>[1],
) {
  if (useApi) return api.apiCreateUbtAgendaConsulta(accessToken, payload)
  return mockCreateUbtAgendaConsulta(accessToken, payload)
}

export async function updateUbtAgendaConsulta(
  accessToken: string,
  consultaId: string,
  payload: Parameters<typeof mockUpdateUbtAgendaConsulta>[2],
) {
  if (useApi) return api.apiUpdateUbtAgendaConsulta(accessToken, consultaId, payload)
  return mockUpdateUbtAgendaConsulta(accessToken, consultaId, payload)
}

export async function cancelUbtAgendaConsulta(accessToken: string, consultaId: string) {
  if (useApi) return api.apiCancelUbtAgendaConsulta(accessToken, consultaId)
  return mockCancelUbtAgendaConsulta(accessToken, consultaId)
}

export async function confirmUbtAgendaRecepcao(accessToken: string, consultaId: string) {
  if (useApi) return api.apiConfirmUbtAgendaRecepcao(accessToken, consultaId)
  return mockConfirmUbtAgendaRecepcao(accessToken, consultaId)
}

export async function markUbtAgendaFalta(accessToken: string, consultaId: string) {
  if (useApi) return api.apiMarkUbtAgendaFalta(accessToken, consultaId)
  return mockMarkUbtAgendaFalta(accessToken, consultaId)
}

export async function createUbtAgendaWalkIn(
  accessToken: string,
  payload: Parameters<typeof mockCreateUbtAgendaWalkIn>[1],
) {
  if (useApi) return api.apiCreateUbtAgendaWalkIn(accessToken, payload)
  return mockCreateUbtAgendaWalkIn(accessToken, payload)
}
