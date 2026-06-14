import type { AdminDoctor } from '../../../types/adminMedicos'
import { ApiError, apiFetch } from '../http'

export class AdminProfissionaisAtivosApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminProfissionaisAtivosApiError'
  }
}

function mapError(error: unknown): AdminProfissionaisAtivosApiError {
  if (error instanceof ApiError) {
    return new AdminProfissionaisAtivosApiError(error.message, error.status, error.code)
  }
  return new AdminProfissionaisAtivosApiError('Não foi possível completar a requisição.', 0)
}

export type AtivosSummaryResponse = {
  total: number
  ativos: number
  inativos: number
  online: number
  emPlantao: number
  nacional: number
  porContrato: number
  medicos: number
  psicologos: number
  nutricionistas: number
  fonoaudiologos: number
  averageRating: number
  avgPatientsMonth: number
}

function buildAtivosQuery(params?: {
  search?: string
  status?: string
  allocation?: string
  profession?: string
}) {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  if (params?.allocation) query.set('allocation', params.allocation)
  if (params?.profession) query.set('profession', params.profession)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function isAdminProfissionaisAtivosApiError(
  error: unknown,
): error is AdminProfissionaisAtivosApiError {
  return error instanceof AdminProfissionaisAtivosApiError
}

export async function fetchAtivosSummary(accessToken: string): Promise<AtivosSummaryResponse> {
  try {
    return await apiFetch<AtivosSummaryResponse>('/admin/profissionais/ativos/summary', {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchProfissionaisAtivosRows(
  accessToken: string,
  params?: {
    search?: string
    status?: string
    allocation?: string
    profession?: string
  },
): Promise<AdminDoctor[]> {
  try {
    const data = await apiFetch<{ profissionais: AdminDoctor[] }>(
      `/admin/profissionais/ativos${buildAtivosQuery(params)}`,
      { accessToken },
    )
    return data.profissionais
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchProfissionalAtivoDetail(
  accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  try {
    const data = await apiFetch<{ profissional: AdminDoctor }>(
      `/admin/profissionais/ativos/${id}`,
      { accessToken },
    )
    return data.profissional
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateProfissionalAtivo(
  accessToken: string,
  id: string,
  payload: {
    phone?: string
    specialty?: string
    onCallLabel?: string
    status?: 'ativo' | 'inativo'
  },
): Promise<AdminDoctor> {
  try {
    const data = await apiFetch<{ profissional: AdminDoctor }>(
      `/admin/profissionais/ativos/${id}`,
      {
        method: 'PATCH',
        accessToken,
        json: payload,
      },
    )
    return data.profissional
  } catch (error) {
    throw mapError(error)
  }
}

export async function inactivateProfissionalAtivo(
  accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  try {
    const data = await apiFetch<{ profissional: AdminDoctor }>(
      `/admin/profissionais/ativos/${id}/inativar`,
      {
        method: 'PATCH',
        accessToken,
      },
    )
    return data.profissional
  } catch (error) {
    throw mapError(error)
  }
}

export async function reactivateProfissionalAtivo(
  accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  try {
    const data = await apiFetch<{ profissional: AdminDoctor }>(
      `/admin/profissionais/ativos/${id}/reativar`,
      {
        method: 'PATCH',
        accessToken,
      },
    )
    return data.profissional
  } catch (error) {
    throw mapError(error)
  }
}

export async function createProfissionalAtivo(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<AdminDoctor> {
  try {
    const data = await apiFetch<{ profissional: AdminDoctor }>('/admin/profissionais/ativos', {
      method: 'POST',
      accessToken,
      json: payload,
    })
    return data.profissional
  } catch (error) {
    throw mapError(error)
  }
}
