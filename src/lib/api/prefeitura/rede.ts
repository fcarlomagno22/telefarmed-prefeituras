import type {
  CreatePrefeituraRedeUnitInput,
  PrefeituraRedeOverviewApi,
  PrefeituraRedeSettingsApi,
  PrefeituraRedeUnitApi,
  PrefeituraRedeUnitDetailApi,
} from '../../mockServices/prefeitura/rede'
import { ApiError, apiFetch } from '../http'

export class PrefeituraRedeApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraRedeApiError'
  }
}

function mapApiError(error: unknown): PrefeituraRedeApiError {
  if (error instanceof ApiError) {
    return new PrefeituraRedeApiError(error.message, error.status, error.code)
  }
  return new PrefeituraRedeApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchPrefeituraRedeOverview(accessToken: string) {
  try {
    return await apiFetch<PrefeituraRedeOverviewApi>('/prefeitura/rede/overview', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraRedeUnits(accessToken: string) {
  try {
    const data = await apiFetch<{ units: PrefeituraRedeUnitApi[] }>('/prefeitura/rede/units', {
      accessToken,
    })
    return data.units
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraRedeUnitDetail(accessToken: string, unitId: string) {
  try {
    return await apiFetch<PrefeituraRedeUnitDetailApi>(`/prefeitura/rede/units/${unitId}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreatePrefeituraRedeUnit(
  accessToken: string,
  body: CreatePrefeituraRedeUnitInput,
) {
  try {
    return await apiFetch<PrefeituraRedeUnitDetailApi>('/prefeitura/rede/units', {
      method: 'POST',
      accessToken,
      json: body,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUpdatePrefeituraRedeUnit(
  accessToken: string,
  unitId: string,
  body: import('../../mockServices/prefeitura/rede').UpdatePrefeituraRedeUnitInput,
) {
  try {
    return await apiFetch<PrefeituraRedeUnitDetailApi>(`/prefeitura/rede/units/${unitId}`, {
      method: 'PATCH',
      accessToken,
      json: body,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiDeletePrefeituraRedeUnit(accessToken: string, unitId: string) {
  try {
    await apiFetch<void>(`/prefeitura/rede/units/${unitId}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiNotifyPrefeituraRedeUnit(
  accessToken: string,
  unitId: string,
  body: import('../../mockServices/prefeitura/rede').NotifyPrefeituraRedeUnitInput,
) {
  try {
    return await apiFetch<{ message: string; recipientCount: number; delivered: boolean }>(
      `/prefeitura/rede/units/${unitId}/notify`,
      {
        method: 'POST',
        accessToken,
        json: body,
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export type UpdatePrefeituraRedeMaintenanceInput = {
  items: Array<{ unitId: string; terminalIndexes: number[] }>
}

export async function apiUpdatePrefeituraRedeMaintenance(
  accessToken: string,
  body: UpdatePrefeituraRedeMaintenanceInput,
) {
  try {
    return await apiFetch<{ items: UpdatePrefeituraRedeMaintenanceInput['items']; units: PrefeituraRedeUnitApi[] }>(
      '/prefeitura/rede/maintenance',
      {
        method: 'PUT',
        accessToken,
        json: body,
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraRedeSettings(accessToken: string) {
  try {
    return await apiFetch<PrefeituraRedeSettingsApi>('/prefeitura/rede/settings', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUpdatePrefeituraRedeSettings(
  accessToken: string,
  body: Omit<PrefeituraRedeSettingsApi, 'packageConsultationsTotal'>,
) {
  try {
    return await apiFetch<PrefeituraRedeSettingsApi>('/prefeitura/rede/settings', {
      method: 'PUT',
      accessToken,
      json: body,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}
