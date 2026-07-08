import { API_BASE_URL } from '../../../config/api'
import type {
  AppRegistrationConsentTermsResponse,
  PatientRegistrationConsentTermsResponse,
} from '../../../types/registrationTerms'

async function fetchPublicTerms<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Não foi possível carregar os termos (${response.status}).`)
  }

  return (await response.json()) as T
}

export async function fetchPatientRegistrationConsentTerms(): Promise<PatientRegistrationConsentTermsResponse> {
  return fetchPublicTerms<PatientRegistrationConsentTermsResponse>(
    '/configuracoes/cadastro-paciente/termos',
  )
}

export async function fetchAppRegistrationConsentTerms(): Promise<AppRegistrationConsentTermsResponse> {
  return fetchPublicTerms<AppRegistrationConsentTermsResponse>(
    '/configuracoes/cadastro-app/termos',
  )
}
