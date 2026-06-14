import type { ConfigProfession, ConfigSpecialty } from '../../types/adminConfiguracoes'
import { ApiError, apiFetch } from './http'

export type PublicClinicoCatalogResponse = {
  professions: ConfigProfession[]
  specialties: ConfigSpecialty[]
}

export async function fetchPublicClinicoCatalog(activeOnly = true): Promise<PublicClinicoCatalogResponse> {
  const query = activeOnly ? '?activeOnly=true' : ''
  return apiFetch<PublicClinicoCatalogResponse>(`/configuracoes/clinico${query}`)
}

export function isPublicConfiguracoesApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
