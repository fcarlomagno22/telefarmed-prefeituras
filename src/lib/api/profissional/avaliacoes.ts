import type {
  ProfissionalAvaliacoesApiSummary,
  ProfissionalAvaliacoesListQuery,
  ProfissionalAvaliacoesListResponse,
} from '../../../types/profissionalAvaliacoesApi'
import { apiFetch, ApiError } from '../http'

export class ProfissionalAvaliacoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalAvaliacoesApiError'
  }
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalAvaliacoesApiError {
  if (error instanceof ApiError) {
    return new ProfissionalAvaliacoesApiError(error.message, error.status, error.code)
  }
  return new ProfissionalAvaliacoesApiError(fallbackMessage, 0)
}

export function isProfissionalAvaliacoesApiError(
  error: unknown,
): error is ProfissionalAvaliacoesApiError {
  return error instanceof ProfissionalAvaliacoesApiError
}

function buildQueryParams(query?: ProfissionalAvaliacoesListQuery): string {
  const params = new URLSearchParams()
  if (query?.criticos) params.set('criticos', 'true')
  if (query?.search?.trim()) params.set('search', query.search.trim())
  if (query?.periodFrom) params.set('periodFrom', query.periodFrom)
  if (query?.periodTo) params.set('periodTo', query.periodTo)
  if (query?.notaMinima != null) params.set('notaMinima', String(query.notaMinima))
  if (query?.limit != null) params.set('limit', String(query.limit))
  if (query?.offset != null) params.set('offset', String(query.offset))
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export async function fetchProfissionalAvaliacoesSummary(
  accessToken: string,
  query?: Omit<ProfissionalAvaliacoesListQuery, 'limit' | 'offset'>,
): Promise<ProfissionalAvaliacoesApiSummary> {
  try {
    return await apiFetch<ProfissionalAvaliacoesApiSummary>(
      `/profissional/avaliacao/summary${buildQueryParams(query)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o resumo das avaliações.')
  }
}

export async function fetchProfissionalAvaliacoesList(
  accessToken: string,
  query?: ProfissionalAvaliacoesListQuery,
): Promise<ProfissionalAvaliacoesListResponse> {
  try {
    return await apiFetch<ProfissionalAvaliacoesListResponse>(
      `/profissional/avaliacao${buildQueryParams(query)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar as avaliações.')
  }
}
