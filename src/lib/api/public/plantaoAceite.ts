import { PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN, PLANTAO_ACEITE_DEMO_TOKEN } from '../../../config/publicRoutes'
import {
  mockConfirmPlantaoAceitePublico,
  mockCandidatarReservaPlantaoAceitePublico,
  mockFetchPlantaoAceitePublico,
} from '../../mockServices/public/plantaoAceite'
import { API_BASE_URL } from '../config'
import type {
  PlantaoAceiteConfirmPayload,
  PlantaoAceiteConfirmResult,
  PlantaoAceitePublicoResult,
  PlantaoAceiteReserveResult,
} from '../../../types/plantaoAceitePublico'

function normalizePlantaoAceiteToken(token: string): string {
  return token.trim()
}

function isDemoPlantaoAceiteToken(token: string): boolean {
  const normalized = normalizePlantaoAceiteToken(token)
  return (
    normalized === PLANTAO_ACEITE_DEMO_TOKEN ||
    normalized === PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN
  )
}

export class PlantaoAceitePublicoApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'PlantaoAceitePublicoApiError'
    this.code = code
    this.status = status
  }
}

export function isPlantaoAceitePublicoApiError(
  error: unknown,
): error is PlantaoAceitePublicoApiError {
  return error instanceof PlantaoAceitePublicoApiError
}

async function parseError(response: Response): Promise<PlantaoAceitePublicoApiError> {
  let message = 'Não foi possível concluir a operação.'
  let code = 'UNKNOWN'

  try {
    const body = (await response.json()) as {
      error?: string
      message?: string
      code?: string
    }
    if (body.error) message = body.error
    else if (body.message) message = body.message
    if (body.code) code = body.code
  } catch {
    // ignore
  }

  return new PlantaoAceitePublicoApiError(message, code, response.status)
}

export async function apiFetchPlantaoAceitePublico(
  token: string,
): Promise<PlantaoAceitePublicoResult> {
  const normalizedToken = normalizePlantaoAceiteToken(token)
  if (isDemoPlantaoAceiteToken(normalizedToken)) {
    return mockFetchPlantaoAceitePublico(normalizedToken)
  }

  const response = await fetch(
    `${API_BASE_URL}/public/plantao-aceite/${encodeURIComponent(normalizedToken)}`,
  )

  if (!response.ok) throw await parseError(response)
  return (await response.json()) as PlantaoAceitePublicoResult
}

export async function apiConfirmPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteConfirmResult> {
  const normalizedPayload = {
    ...payload,
    token: normalizePlantaoAceiteToken(payload.token),
    cpf: payload.cpf.trim(),
  }

  if (isDemoPlantaoAceiteToken(normalizedPayload.token)) {
    return mockConfirmPlantaoAceitePublico(normalizedPayload)
  }

  const response = await fetch(`${API_BASE_URL}/public/plantao-aceite/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  })

  if (!response.ok) throw await parseError(response)
  return (await response.json()) as PlantaoAceiteConfirmResult
}

export async function apiCandidatarReservaPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteReserveResult> {
  const normalizedPayload = {
    ...payload,
    token: normalizePlantaoAceiteToken(payload.token),
    cpf: payload.cpf.trim(),
  }

  if (isDemoPlantaoAceiteToken(normalizedPayload.token)) {
    return mockCandidatarReservaPlantaoAceitePublico(normalizedPayload)
  }

  const response = await fetch(`${API_BASE_URL}/public/plantao-aceite/candidatar-reserva`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  })

  if (!response.ok) throw await parseError(response)
  return (await response.json()) as PlantaoAceiteReserveResult
}
