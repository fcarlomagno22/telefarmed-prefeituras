import type { AdminEscalaShift, EscalaRepasseRule } from '../../../types/adminEscala'
import { apiFetch, ApiError } from '../http'

export class AdminEscalaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminEscalaApiError'
  }
}

export type EscalaScopePrefeituraApi = {
  mode: 'all' | 'selected'
  prefeituraIds: string[]
  contratosPorPrefeitura?: Record<string, string>
}

export type EscalaScopeUbtApi = {
  mode: 'all' | 'selected' | 'tele_only'
  ubtIds: string[]
}

export type EscalaSummaryApi = {
  publishedCount: number
  openVacancies: number
  claimedThisMonth: number
  fillRatePercent: number
  averageOpenAmountCents: number
  partialCount: number
  withoutBackupCount: number
  draftCount: number
  pendingInscriptions: number
}

export type EscalaDoctorOptionApi = {
  value: string
  label: string
  specialty: string
}

export type EscalaPrefeituraCatalogApi = {
  id: string
  name: string
  municipio: string
  uf: string
  status: string
}

export type EscalaUbtCatalogApi = {
  id: string
  name: string
  municipalityId: string
  municipalityName: string
  region: string
  regionKey: string
  status: 'ativa' | 'manutencao' | 'inativa'
}

export type EscalaSpecialtyCatalogApi = {
  id: string
  name: string
  active: boolean
}

export type EscalaCatalogApi = {
  doctors: EscalaDoctorOptionApi[]
  prefeituras: EscalaPrefeituraCatalogApi[]
  ubts: EscalaUbtCatalogApi[]
  specialties: EscalaSpecialtyCatalogApi[]
}

export type EscalaContratoOptionApi = {
  id: string
  entidadeContratanteId: string
  entidadeNome: string
  numero: string | null
  tipo: string
  tipoLabel: string
  status: string
  statusLabel: string
  dataAssinatura: string
  dataEncerramento: string | null
  especialidadesAutorizadas: string[]
  label: string
}

export type BatchSavePayload = {
  batchId: string
  replaceBatchId?: string
  removeShiftIds?: string[]
  status: 'rascunho' | 'publicada'
  titulo?: string
  contratoEntidadeId?: string
  prefeituraScope: EscalaScopePrefeituraApi
  ubtScope: EscalaScopeUbtApi
  shifts: Array<{
    specialtyId: string
    specialty?: string
    startAt: string
    endAt: string
    assignmentMode: 'assigned' | 'open'
    primaryDoctorId?: string
    backupDoctorIds?: string[]
    modality: 'tele' | 'hibrido' | 'presencial_ubt'
    vacancies?: number
    totalVacancies?: number
    amountCents: number
    repasseRule: EscalaRepasseRule
    unitName?: string
    city?: string
    cityUf?: string
    fullAddress?: string | null
    notes?: string
  }>
}

export type EscalaInscricaoApi = {
  id: string
  slotId: string
  profissionalId: string
  profissionalNome: string
  status: string
  inscritoEm: string
  respondidoEm?: string | null
  motivoRejeicao?: string | null
}

function mapError(error: unknown): AdminEscalaApiError {
  if (error instanceof ApiError) {
    return new AdminEscalaApiError(error.message, error.status, error.code)
  }
  return new AdminEscalaApiError('Não foi possível completar a requisição.', 0)
}

function buildQuery(params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function isAdminEscalaApiError(error: unknown): error is AdminEscalaApiError {
  return error instanceof AdminEscalaApiError
}

export async function fetchAdminEscalaShifts(
  accessToken: string,
  params?: Record<string, string | undefined>,
): Promise<AdminEscalaShift[]> {
  try {
    const data = await apiFetch<{ shifts: AdminEscalaShift[] }>(
      `/admin/escala/shifts${buildQuery(params ?? {})}`,
      { accessToken },
    )
    return data.shifts
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchAdminEscalaSummary(accessToken: string): Promise<EscalaSummaryApi> {
  try {
    return await apiFetch<EscalaSummaryApi>('/admin/escala/summary', { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchAdminEscalaCatalog(accessToken: string): Promise<EscalaCatalogApi> {
  try {
    return await apiFetch<EscalaCatalogApi>('/admin/escala/catalog', { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchAdminEscalaContratos(
  accessToken: string,
  params: {
    prefeituraScope: EscalaScopePrefeituraApi
    specialtyIds?: string[]
  },
): Promise<EscalaContratoOptionApi[]> {
  try {
    return await apiFetch<EscalaContratoOptionApi[]>('/admin/escala/contratos', {
      method: 'POST',
      accessToken,
      json: params,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function saveAdminEscalaBatch(
  accessToken: string,
  payload: BatchSavePayload,
): Promise<{ shifts: AdminEscalaShift[]; programacaoId: string; batchId: string }> {
  try {
    return await apiFetch<{ shifts: AdminEscalaShift[]; programacaoId: string; batchId: string }>(
      '/admin/escala/batches',
      {
        method: 'POST',
        accessToken,
        json: payload,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function deleteAdminEscalaShifts(
  accessToken: string,
  shiftIds: string[],
): Promise<{ message: string; notifiedCount: number }> {
  try {
    return await apiFetch<{ message: string; notifiedCount: number }>('/admin/escala/shifts', {
      method: 'DELETE',
      accessToken,
      json: { shiftIds },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function checkAdminEscalaConflicts(
  accessToken: string,
  payload: {
    doctorIds: string[]
    excludeBatchId?: string
    shifts: Array<{
      id?: string
      batchId?: string
      startAt: string
      endAt: string
      status?: string
      primaryDoctorId?: string
      backupDoctorIds?: string[]
    }>
  },
): Promise<{ conflicts: string[]; hasConflict: boolean }> {
  try {
    return await apiFetch<{ conflicts: string[]; hasConflict: boolean }>(
      '/admin/escala/conflicts',
      {
        method: 'POST',
        accessToken,
        json: payload,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchAdminEscalaInscricoes(
  accessToken: string,
  params?: { status?: string; slotId?: string },
): Promise<EscalaInscricaoApi[]> {
  try {
    const data = await apiFetch<{ inscricoes: EscalaInscricaoApi[] }>(
      `/admin/escala/inscricoes${buildQuery(params ?? {})}`,
      { accessToken },
    )
    return data.inscricoes
  } catch (error) {
    throw mapError(error)
  }
}

export async function acceptAdminEscalaInscricao(
  accessToken: string,
  inscricaoId: string,
): Promise<void> {
  try {
    await apiFetch<void>(`/admin/escala/inscricoes/${inscricaoId}/accept`, {
      method: 'POST',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function rejectAdminEscalaInscricao(
  accessToken: string,
  inscricaoId: string,
  motivoRejeicao: string,
): Promise<void> {
  try {
    await apiFetch<void>(`/admin/escala/inscricoes/${inscricaoId}/reject`, {
      method: 'POST',
      accessToken,
      json: { motivoRejeicao },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function cancelAdminEscalaPlantao(
  accessToken: string,
  plantaoId: string,
  motivoCancelamento: string,
): Promise<void> {
  try {
    await apiFetch<void>(`/admin/escala/shifts/${plantaoId}/cancel`, {
      method: 'POST',
      accessToken,
      json: { motivoCancelamento },
    })
  } catch (error) {
    throw mapError(error)
  }
}
