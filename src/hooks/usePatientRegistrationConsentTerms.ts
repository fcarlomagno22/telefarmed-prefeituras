import { useEffect, useState } from 'react'
import { fetchPatientRegistrationConsentTerms } from '../lib/services/public/patientRegistrationConsentTerms'
import type {
  PatientRegistrationConsentTermKey,
  PatientRegistrationConsentTermsCatalog,
} from '../types/patientRegistrationConsentTerms'

export function usePatientRegistrationConsentTerms(enabled = true) {
  const [terms, setTerms] = useState<PatientRegistrationConsentTermsCatalog | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadTerms() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const response = await fetchPatientRegistrationConsentTerms()
        if (!cancelled) {
          setTerms(response.terms)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível carregar os termos. Tente novamente.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTerms()

    return () => {
      cancelled = true
    }
  }, [enabled])

  function getTerm(key: PatientRegistrationConsentTermKey) {
    return terms?.[key] ?? null
  }

  return {
    terms,
    isLoading,
    loadError,
    getTerm,
  }
}
