import {
  PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN,
  PLANTAO_ACEITE_DEMO_TOKEN,
  PLANTAO_ACEITE_DIGEST_DEMO_TOKEN,
} from '../../../config/publicRoutes'
import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/public/plantaoAceite'
import {
  mockConfirmPlantaoAceitePublico,
  mockCandidatarReservaPlantaoAceitePublico,
  mockFetchPlantaoAceiteDigest,
  mockFetchPlantaoAceitePublico,
  PlantaoAceitePublicoApiError as MockPlantaoAceitePublicoApiError,
  isPlantaoAceitePublicoApiError as mockIsPlantaoAceitePublicoApiError,
} from '../../mockServices/public/plantaoAceite'
import type {
  PlantaoAceiteConfirmPayload,
  PlantaoAceiteConfirmResult,
  PlantaoAceiteDigestResult,
  PlantaoAceitePublicoResult,
  PlantaoAceiteReserveResult,
} from '../../../types/plantaoAceitePublico'

const useApi = isBackendApiEnabled()

function normalizePlantaoAceiteToken(token: string): string {
  return token.trim()
}

function isDemoPlantaoAceiteToken(token: string): boolean {
  const normalized = normalizePlantaoAceiteToken(token)
  return (
    normalized === PLANTAO_ACEITE_DEMO_TOKEN ||
    normalized === PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN ||
    normalized === PLANTAO_ACEITE_DIGEST_DEMO_TOKEN
  )
}

export const PlantaoAceitePublicoApiError = useApi
  ? api.PlantaoAceitePublicoApiError
  : MockPlantaoAceitePublicoApiError

export const isPlantaoAceitePublicoApiError = useApi
  ? api.isPlantaoAceitePublicoApiError
  : mockIsPlantaoAceitePublicoApiError

export async function fetchPlantaoAceiteDigest(
  token: string,
): Promise<PlantaoAceiteDigestResult> {
  const normalizedToken = normalizePlantaoAceiteToken(token)
  if (normalizedToken === PLANTAO_ACEITE_DIGEST_DEMO_TOKEN || !useApi) {
    return mockFetchPlantaoAceiteDigest(normalizedToken)
  }
  return api.apiFetchPlantaoAceiteDigest(normalizedToken)
}

export async function fetchPlantaoAceitePublico(
  token: string,
): Promise<PlantaoAceitePublicoResult> {
  const normalizedToken = normalizePlantaoAceiteToken(token)
  if (isDemoPlantaoAceiteToken(normalizedToken) || !useApi) {
    return mockFetchPlantaoAceitePublico(normalizedToken)
  }
  return api.apiFetchPlantaoAceitePublico(normalizedToken)
}

export async function confirmPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteConfirmResult> {
  const normalizedPayload = {
    ...payload,
    token: normalizePlantaoAceiteToken(payload.token),
    cpf: payload.cpf.trim(),
  }
  if (isDemoPlantaoAceiteToken(normalizedPayload.token) || !useApi) {
    return mockConfirmPlantaoAceitePublico(normalizedPayload)
  }
  return api.apiConfirmPlantaoAceitePublico(normalizedPayload)
}

export async function candidatarReservaPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteReserveResult> {
  const normalizedPayload = {
    ...payload,
    token: normalizePlantaoAceiteToken(payload.token),
    cpf: payload.cpf.trim(),
  }
  if (isDemoPlantaoAceiteToken(normalizedPayload.token) || !useApi) {
    return mockCandidatarReservaPlantaoAceitePublico(normalizedPayload)
  }
  return api.apiCandidatarReservaPlantaoAceitePublico(normalizedPayload)
}
