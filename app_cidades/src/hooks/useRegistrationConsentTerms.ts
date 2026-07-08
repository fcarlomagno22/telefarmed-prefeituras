import { useCallback, useEffect, useState } from 'react'
import {
  fetchAppRegistrationConsentTerms,
  fetchPatientRegistrationConsentTerms,
} from '../lib/api/public/registrationTerms'
import type {
  AppRegistrationConsentTermsResponse,
  PatientRegistrationConsentTermsResponse,
} from '../types/registrationTerms'
import {
  buildRegisterLegalAgreements,
  type RegisterLegalAgreement,
} from '../utils/registerLegalAgreements'

type UseRegistrationConsentTermsResult = {
  agreements: RegisterLegalAgreement[]
  isLoading: boolean
  loadError: string | null
  reload: () => void
  appTerms: AppRegistrationConsentTermsResponse | null
  patientTerms: PatientRegistrationConsentTermsResponse | null
}

export function useRegistrationConsentTerms(enabled = true): UseRegistrationConsentTermsResult {
  const [appTerms, setAppTerms] = useState<AppRegistrationConsentTermsResponse | null>(null)
  const [patientTerms, setPatientTerms] = useState<PatientRegistrationConsentTermsResponse | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(enabled)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadTerms() {
      setIsLoading(true)
      setLoadError(null)

      const [patientResult, appResult] = await Promise.allSettled([
        fetchPatientRegistrationConsentTerms(),
        fetchAppRegistrationConsentTerms(),
      ])

      if (cancelled) return

      const nextPatientTerms =
        patientResult.status === 'fulfilled' ? patientResult.value : null
      const nextAppTerms = appResult.status === 'fulfilled' ? appResult.value : null

      setPatientTerms(nextPatientTerms)
      setAppTerms(nextAppTerms)

      if (!nextAppTerms) {
        setLoadError('Não foi possível carregar os termos atualizados. Exibindo versão padrão.')
      }

      setIsLoading(false)
    }

    void loadTerms()

    return () => {
      cancelled = true
    }
  }, [enabled, reloadToken])

  return {
    agreements: buildRegisterLegalAgreements(appTerms, patientTerms),
    isLoading,
    loadError,
    reload,
    appTerms,
    patientTerms,
  }
}
