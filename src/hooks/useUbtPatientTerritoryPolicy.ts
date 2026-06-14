import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PatientAddressTerritoryRequirement } from '../components/dashboard/PatientAddressStep'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPatientTerritoryPolicy,
  type UbtPatientTerritoryPolicy,
} from '../lib/services/ubt/pacientes'

export function resolveUbtPatientAddressTerritoryRequirement(
  policy: UbtPatientTerritoryPolicy | null | undefined,
): PatientAddressTerritoryRequirement | undefined {
  if (!policy || policy.aceitaPacientesOutrosMunicipios) return undefined
  return {
    municipality: policy.municipio,
    uf: policy.uf,
  }
}

export function useUbtPatientTerritoryPolicy(enabled = true) {
  const { getAccessToken, isBootstrapping, user } = useUbtAuth()
  const [policy, setPolicy] = useState<UbtPatientTerritoryPolicy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setPolicy(null)
      setLoadError('Sessão expirada.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchUbtPatientTerritoryPolicy(token)
      setPolicy(response.policy)
      setLoadError(null)
    } catch {
      if (user) {
        setPolicy({
          municipio: user.municipio,
          uf: user.uf,
          aceitaPacientesOutrosMunicipios: false,
        })
      } else {
        setPolicy(null)
      }
      setLoadError('Não foi possível confirmar a política do contrato. Aplicando restrição do município da entidade.')
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, user])

  useEffect(() => {
    if (!enabled || isBootstrapping) return
    void reload()
  }, [enabled, isBootstrapping, reload])

  const requiredTerritory = useMemo(
    () => resolveUbtPatientAddressTerritoryRequirement(policy),
    [policy],
  )

  return {
    policy,
    requiredTerritory,
    allowsOtherMunicipalities: Boolean(policy?.aceitaPacientesOutrosMunicipios),
    isLoading,
    loadError,
    reload,
  }
}
