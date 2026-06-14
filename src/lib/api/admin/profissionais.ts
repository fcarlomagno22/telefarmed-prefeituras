import type { AdminProfissionalCandidatura } from '../../../types/adminProfissionais'
import { ApiError, apiFetch } from '../http'

export class AdminProfissionaisApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminProfissionaisApiError'
  }
}

function mapError(error: unknown): AdminProfissionaisApiError {
  if (error instanceof ApiError) {
    return new AdminProfissionaisApiError(error.message, error.status, error.code)
  }
  return new AdminProfissionaisApiError('Não foi possível completar a requisição.', 0)
}

export type CandidaturasSummaryResponse = {
  total: number
  pendente: number
  incompleto: number
  aprovado: number
  reprovado: number
  em_analise: number
  aguardandoFinalizacao: number
}

function buildCandidaturasQuery(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function isAdminProfissionaisApiError(error: unknown): error is AdminProfissionaisApiError {
  return error instanceof AdminProfissionaisApiError
}

export async function fetchCandidaturasSummary(
  accessToken: string,
): Promise<CandidaturasSummaryResponse> {
  try {
    return await apiFetch<CandidaturasSummaryResponse>('/admin/profissionais/candidaturas/summary', {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchCandidaturasRows(
  accessToken: string,
  params?: { search?: string; status?: string },
): Promise<AdminProfissionalCandidatura[]> {
  try {
    const data = await apiFetch<{ candidaturas: AdminProfissionalCandidatura[] }>(
      `/admin/profissionais/candidaturas${buildCandidaturasQuery(params)}`,
      { accessToken },
    )
    return data.candidaturas
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchCandidaturaDetail(
  accessToken: string,
  id: string,
): Promise<AdminProfissionalCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: AdminProfissionalCandidatura }>(
      `/admin/profissionais/candidaturas/${id}`,
      { accessToken },
    )
    return data.candidatura
  } catch (error) {
    throw mapError(error)
  }
}

export async function reviewCandidaturaDocument(
  accessToken: string,
  candidaturaId: string,
  documentoId: string,
  payload: { status: 'pendente' | 'aprovado' | 'reprovado'; motivoReprovacao?: string },
): Promise<AdminProfissionalCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: AdminProfissionalCandidatura }>(
      `/admin/profissionais/candidaturas/${candidaturaId}/documentos/${documentoId}`,
      {
        method: 'PATCH',
        accessToken,
        json: payload,
      },
    )
    return data.candidatura
  } catch (error) {
    throw mapError(error)
  }
}

export async function approveCandidatura(
  accessToken: string,
  candidaturaId: string,
): Promise<{ candidatura: AdminProfissionalCandidatura; accessCode?: string }> {
  try {
    return await apiFetch<{ candidatura: AdminProfissionalCandidatura; accessCode?: string }>(
      `/admin/profissionais/candidaturas/${candidaturaId}/aprovar`,
      {
        method: 'POST',
        accessToken,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function rejectCandidatura(
  accessToken: string,
  candidaturaId: string,
  motivo: string,
): Promise<AdminProfissionalCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: AdminProfissionalCandidatura }>(
      `/admin/profissionais/candidaturas/${candidaturaId}/reprovar`,
      {
        method: 'POST',
        accessToken,
        json: { motivo },
      },
    )
    return data.candidatura
  } catch (error) {
    throw mapError(error)
  }
}

export async function requestCandidaturaCorrection(
  accessToken: string,
  candidaturaId: string,
  payload: { mensagem: string; documentoIds: string[] },
): Promise<AdminProfissionalCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: AdminProfissionalCandidatura }>(
      `/admin/profissionais/candidaturas/${candidaturaId}/solicitar-correcao`,
      {
        method: 'POST',
        accessToken,
        json: payload,
      },
    )
    return data.candidatura
  } catch (error) {
    throw mapError(error)
  }
}
