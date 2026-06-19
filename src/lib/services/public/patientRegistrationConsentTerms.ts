import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/public/patientRegistrationConsentTerms'
import * as mock from '../../mockServices/public/patientRegistrationConsentTerms'

const useApi = isBackendApiEnabled()

export async function fetchPatientRegistrationConsentTerms() {
  if (useApi) {
    return api.fetchPatientRegistrationConsentTerms()
  }
  return mock.fetchPatientRegistrationConsentTerms()
}
