import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import { apiFetch, ApiError } from '../http'

export class ProfissionalEscalaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalEscalaApiError'
  }
}

export type ProfissionalEscalaSummaryApi = {
  claimedThisMonth: number
  grossRevenueCents: number
  acceptanceRatePercent: number
  pendingInscriptions: number
}

export type ProfissionalEscalaSlotApi = ProfissionalEscalaDisponivel & {
  inscricaoId?: string
  plantaoId?: string
}

export type ProfissionalPlantaoApi = ProfissionalEscalaSlotApi & {
  plantaoId: string
  plantaoStatus: string
  confirmadoEm: string
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalEscalaApiError {
  if (error instanceof ApiError) {
    return new ProfissionalEscalaApiError(error.message, error.status, error.code)
  }
  return new ProfissionalEscalaApiError(fallbackMessage, 0)
}

export function isProfissionalEscalaApiError(error: unknown): error is ProfissionalEscalaApiError {
  return error instanceof ProfissionalEscalaApiError
}

export async function fetchProfissionalEscalaDisponiveis(
  accessToken: string,
  params?: { dateFrom?: string; dateTo?: string },
): Promise<ProfissionalEscalaSlotApi[]> {
  const search = new URLSearchParams()
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom)
  if (params?.dateTo) search.set('dateTo', params.dateTo)
  const query = search.toString()

  try {
    const data = await apiFetch<{ shifts: ProfissionalEscalaSlotApi[] }>(
      `/profissional/escala/disponiveis${query ? `?${query}` : ''}`,
      { accessToken },
    )
    return data.shifts
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar os plantões disponíveis.')
  }
}

export async function fetchProfissionalMeusPlantoes(
  accessToken: string,
): Promise<ProfissionalPlantaoApi[]> {
  try {
    const data = await apiFetch<{ plantoes: ProfissionalPlantaoApi[] }>(
      '/profissional/escala/meus-plantoes',
      { accessToken },
    )
    return data.plantoes
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar seus plantões.')
  }
}

export async function fetchProfissionalEscalaSummary(
  accessToken: string,
): Promise<ProfissionalEscalaSummaryApi> {
  try {
    return await apiFetch<ProfissionalEscalaSummaryApi>('/profissional/escala/summary', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o resumo da escala.')
  }
}

export async function inscreverProfissionalEscalaSlot(accessToken: string, slotId: string) {
  try {
    return await apiFetch<{
      slot: ProfissionalEscalaSlotApi
      plantaoId: string
      inscricaoId: string
    }>(`/profissional/escala/slots/${encodeURIComponent(slotId)}/inscrever`, {
      method: 'POST',
      accessToken,
      json: {},
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível reservar este plantão.')
  }
}

export async function cancelarProfissionalEscalaInscricao(
  accessToken: string,
  inscricaoId: string,
): Promise<void> {
  try {
    await apiFetch<void>(
      `/profissional/escala/inscricoes/${encodeURIComponent(inscricaoId)}`,
      {
        method: 'DELETE',
        accessToken,
      },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível cancelar a inscrição.')
  }
}

export async function cancelarProfissionalEscalaPlantao(
  accessToken: string,
  plantaoId: string,
): Promise<void> {
  try {
    await apiFetch<void>(`/profissional/escala/plantoes/${encodeURIComponent(plantaoId)}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível cancelar o plantão.')
  }
}
