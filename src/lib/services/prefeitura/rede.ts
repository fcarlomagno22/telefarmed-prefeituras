import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/rede'
import {
  PrefeituraRedeApiError as MockPrefeituraRedeApiError,
  createPrefeituraRedeUnit as mockCreatePrefeituraRedeUnit,
  fetchPrefeituraRedeOverview as mockFetchPrefeituraRedeOverview,
  fetchPrefeituraRedeUnitDetail as mockFetchPrefeituraRedeUnitDetail,
  fetchPrefeituraRedeUnits as mockFetchPrefeituraRedeUnits,
  isPrefeituraRedeApiError as mockIsPrefeituraRedeApiError,
  mapApiUnitToRedeUnit,
  mapOverviewDonutSlices,
  mapOverviewKpisToCards,
  mapRedeDetailToCadastral,
  mapRedeDetailToUbsDetail,
  updatePrefeituraRedeUnit as mockUpdatePrefeituraRedeUnit,
  deletePrefeituraRedeUnit as mockDeletePrefeituraRedeUnit,
  notifyPrefeituraRedeUnit as mockNotifyPrefeituraRedeUnit,
  type CreatePrefeituraRedeUnitInput,
  type NotifyPrefeituraRedeUnitInput,
  type PrefeituraRedeOverviewApi,
  type PrefeituraRedeSettingsApi,
  type PrefeituraRedeUnitApi,
  type PrefeituraRedeUnitDetailApi,
  type UpdatePrefeituraRedeUnitInput,
} from '../../mockServices/prefeitura/rede'

export type {
  CreatePrefeituraRedeUnitInput,
  NotifyPrefeituraRedeUnitInput,
  PrefeituraRedeOverviewApi,
  PrefeituraRedeSettingsApi,
  PrefeituraRedeUnitApi,
  PrefeituraRedeUnitDetailApi,
  UpdatePrefeituraRedeUnitInput,
}

export {
  mapApiUnitToRedeUnit,
  mapOverviewDonutSlices,
  mapOverviewKpisToCards,
  mapRedeDetailToCadastral,
  mapRedeDetailToUbsDetail,
}

export const PrefeituraRedeApiError = isBackendApiEnabled()
  ? api.PrefeituraRedeApiError
  : MockPrefeituraRedeApiError

export function isPrefeituraRedeApiError(error: unknown): error is PrefeituraRedeApiError {
  if (isBackendApiEnabled()) {
    return error instanceof api.PrefeituraRedeApiError
  }
  return mockIsPrefeituraRedeApiError(error)
}

export async function fetchPrefeituraRedeOverview(accessToken: string) {
  if (isBackendApiEnabled()) {
    const overview = await api.apiFetchPrefeituraRedeOverview(accessToken)
    return {
      ...overview,
      regionSlices: mapOverviewDonutSlices(overview.regionSlices),
      stationStatusSlices: mapOverviewDonutSlices(overview.stationStatusSlices),
    }
  }
  return mockFetchPrefeituraRedeOverview(accessToken)
}

export async function fetchPrefeituraRedeUnits(accessToken: string) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraRedeUnits(accessToken)
  }
  return mockFetchPrefeituraRedeUnits(accessToken)
}

export async function fetchPrefeituraRedeUnitDetail(accessToken: string, unitId: string) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraRedeUnitDetail(accessToken, unitId)
  }
  return mockFetchPrefeituraRedeUnitDetail(accessToken, unitId)
}

export async function createPrefeituraRedeUnit(
  accessToken: string,
  body: CreatePrefeituraRedeUnitInput,
) {
  if (isBackendApiEnabled()) {
    return api.apiCreatePrefeituraRedeUnit(accessToken, body)
  }
  return mockCreatePrefeituraRedeUnit(accessToken, body)
}

export async function updatePrefeituraRedeUnit(
  accessToken: string,
  unitId: string,
  body: UpdatePrefeituraRedeUnitInput,
) {
  if (isBackendApiEnabled()) {
    return api.apiUpdatePrefeituraRedeUnit(accessToken, unitId, body)
  }
  return mockUpdatePrefeituraRedeUnit(accessToken, unitId, body)
}

export async function deletePrefeituraRedeUnit(accessToken: string, unitId: string) {
  if (isBackendApiEnabled()) {
    return api.apiDeletePrefeituraRedeUnit(accessToken, unitId)
  }
  return mockDeletePrefeituraRedeUnit(accessToken, unitId)
}

export async function notifyPrefeituraRedeUnit(
  accessToken: string,
  unitId: string,
  body: NotifyPrefeituraRedeUnitInput,
) {
  if (isBackendApiEnabled()) {
    return api.apiNotifyPrefeituraRedeUnit(accessToken, unitId, body)
  }
  return mockNotifyPrefeituraRedeUnit(accessToken, unitId, body)
}

export async function updatePrefeituraRedeMaintenance(
  accessToken: string,
  body: api.UpdatePrefeituraRedeMaintenanceInput,
) {
  if (isBackendApiEnabled()) {
    return api.apiUpdatePrefeituraRedeMaintenance(accessToken, body)
  }

  for (const item of body.items) {
    await mockUpdatePrefeituraRedeUnit(accessToken, item.unitId, {
      maintenanceTerminalIndexes: item.terminalIndexes,
    })
  }

  return {
    items: body.items,
    units: await mockFetchPrefeituraRedeUnits(accessToken),
  }
}

export async function fetchPrefeituraRedeSettings(accessToken: string) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraRedeSettings(accessToken)
  }

  const units = await mockFetchPrefeituraRedeUnits(accessToken)
  const perUnit = Math.max(1, Math.floor(512 / Math.max(1, units.length)))

  return {
    limitDailyCapacity: true,
    dailyCapacity: 512,
    limitPerUnit: false,
    unitDailyLimits: Object.fromEntries(units.map((unit) => [unit.id, String(perUnit)])),
    unitSpecialties: Object.fromEntries(units.map((unit) => [unit.id, [] as string[]])),
    allowAvulso: true,
    packageConsultationsTotal: 1200,
  } satisfies PrefeituraRedeSettingsApi
}

export async function updatePrefeituraRedeSettings(
  accessToken: string,
  body: Omit<PrefeituraRedeSettingsApi, 'packageConsultationsTotal'>,
) {
  if (isBackendApiEnabled()) {
    return api.apiUpdatePrefeituraRedeSettings(accessToken, body)
  }

  if (body.limitPerUnit && body.unitDailyLimits) {
    await Promise.all(
      Object.entries(body.unitDailyLimits).map(([unitId, value]) =>
        mockUpdatePrefeituraRedeUnit(accessToken, unitId, {
          dailyCapacity: Math.max(0, parseInt(value, 10) || 0),
        }),
      ),
    )
  }

  if (body.unitSpecialties) {
    await Promise.all(
      Object.entries(body.unitSpecialties).map(([unitId, specialtyIds]) =>
        mockUpdatePrefeituraRedeUnit(accessToken, unitId, { specialties: specialtyIds }),
      ),
    )
  }

  return fetchPrefeituraRedeSettings(accessToken)
}
