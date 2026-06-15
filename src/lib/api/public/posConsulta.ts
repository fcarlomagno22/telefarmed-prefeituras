import type {
  PosConsultaCheckinContext,
  PosConsultaCheckinRespostas,
  PosConsultaSubmitResult,
} from '../../../types/posConsulta'
import { ApiError, apiFetch } from '../http'

export class PublicPosConsultaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PublicPosConsultaApiError'
  }
}

function mapError(error: unknown): PublicPosConsultaApiError {
  if (error instanceof ApiError) {
    return new PublicPosConsultaApiError(error.message, error.status, error.code)
  }
  return new PublicPosConsultaApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchPublicPosConsultaCheckin(
  token: string,
): Promise<PosConsultaCheckinContext> {
  try {
    return await apiFetch<PosConsultaCheckinContext>(
      `/public/pos-consulta/checkins/${encodeURIComponent(token.trim())}`,
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiSubmitPublicPosConsultaCheckin(
  token: string,
  respostas: PosConsultaCheckinRespostas,
): Promise<PosConsultaSubmitResult> {
  try {
    return await apiFetch<PosConsultaSubmitResult>(
      `/public/pos-consulta/checkins/${encodeURIComponent(token.trim())}`,
      { method: 'POST', json: respostas },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isPublicPosConsultaApiError(error: unknown): error is PublicPosConsultaApiError {
  return error instanceof PublicPosConsultaApiError
}
