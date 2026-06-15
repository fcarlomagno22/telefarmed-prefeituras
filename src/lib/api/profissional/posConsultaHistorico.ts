import type { ProfissionalPacienteHistoricoResponse } from '../../../types/posConsultaHistorico'
import { ApiError, apiFetch } from '../http'

export class ProfissionalHistoricoApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalHistoricoApiError'
  }
}

function mapError(error: unknown): ProfissionalHistoricoApiError {
  if (error instanceof ApiError) {
    return new ProfissionalHistoricoApiError(error.message, error.status, error.code)
  }
  return new ProfissionalHistoricoApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchProfissionalPacienteHistoricoEspecialidade(
  accessToken: string,
  params: { pacienteId: string; specialty: string },
): Promise<ProfissionalPacienteHistoricoResponse> {
  try {
    const query = new URLSearchParams({ specialty: params.specialty })
    return await apiFetch<ProfissionalPacienteHistoricoResponse>(
      `/profissional/pos-consulta/pacientes/${encodeURIComponent(params.pacienteId)}/historico?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isProfissionalHistoricoApiError(error: unknown): error is ProfissionalHistoricoApiError {
  return error instanceof ProfissionalHistoricoApiError
}
