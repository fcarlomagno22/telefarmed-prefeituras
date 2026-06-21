import type { WaitingQueueEntry } from '../../../types/waitingQueue'
import { ApiError, apiFetch } from '../http'

export class UbtTriagemApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtTriagemApiError'
  }
}

function mapError(error: unknown): UbtTriagemApiError {
  if (error instanceof ApiError) {
    return new UbtTriagemApiError(error.message, error.status, error.code)
  }
  return new UbtTriagemApiError('Não foi possível completar a requisição.', 0)
}

export type UbtTriagemEspecialidadeCatalog = {
  contratoId: string | null
  date: string
  specialties: Array<{
    id: string
    name: string
    availableSlots: number
    available: boolean
    origemAtendimento?: 'mp' | 'mt'
    rh3EspecialidadId?: number
  }>
}

export type FilaLiveApiResponse = {
  entries: WaitingQueueEntry[]
  priorityCount: number
  serverTime: string
}

export type FilaStatusUpdate = 'em_atendimento' | 'finalizado' | 'desistiu'

export async function apiFetchUbtTriagemEspecialidadeCatalog(
  accessToken: string,
  date?: string,
) {
  try {
    const suffix = date ? `?date=${encodeURIComponent(date)}` : ''
    return await apiFetch<UbtTriagemEspecialidadeCatalog>(
      `/ubt/triagem/especialidades${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtFilaLive(accessToken: string) {
  try {
    return await apiFetch<FilaLiveApiResponse>('/ubt/triagem/fila', { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCheckInUbtFila(accessToken: string, agendaConsultaId: string) {
  try {
    const response = await apiFetch<{ entry: WaitingQueueEntry }>(
      '/ubt/triagem/fila/check-in',
      { accessToken, method: 'POST', json: { agendaConsultaId } },
    )
    return response.entry
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiChamarUbtFilaPaciente(accessToken: string, filaId: string) {
  try {
    const response = await apiFetch<{ entry: WaitingQueueEntry }>(
      `/ubt/triagem/fila/${encodeURIComponent(filaId)}/chamar`,
      { accessToken, method: 'POST' },
    )
    return response.entry
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiChamarUbtFilaProximo(accessToken: string) {
  try {
    const response = await apiFetch<{ entry: WaitingQueueEntry }>(
      '/ubt/triagem/fila/chamar-proximo',
      { accessToken, method: 'POST' },
    )
    return response.entry
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpdateUbtFilaStatus(
  accessToken: string,
  filaId: string,
  status: FilaStatusUpdate,
) {
  try {
    const response = await apiFetch<{ entry: WaitingQueueEntry }>(
      `/ubt/triagem/fila/${encodeURIComponent(filaId)}/status`,
      { accessToken, method: 'PATCH', json: { status } },
    )
    return response.entry
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtTriagemDashboard(accessToken: string) {
  try {
    return await apiFetch<import('../../../types/ubtDashboard').UbtDashboardOverview>(
      '/ubt/triagem/dashboard',
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}
