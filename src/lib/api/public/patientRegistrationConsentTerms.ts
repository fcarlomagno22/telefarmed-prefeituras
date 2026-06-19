import { API_BASE_URL } from '../config'
import type { PatientRegistrationConsentTermsResponse } from '../../types/patientRegistrationConsentTerms'

export async function fetchPatientRegistrationConsentTerms(): Promise<PatientRegistrationConsentTermsResponse> {
  const response = await fetch(`${API_BASE_URL}/configuracoes/cadastro-paciente/termos`, {
    method: 'GET',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar os termos do cadastro.')
  }

  return (await response.json()) as PatientRegistrationConsentTermsResponse
}
