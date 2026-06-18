import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  patientContractAllowsOtherMunicipalities,
  resolvePatientAddressTerritoryRequirement,
  type PatientTerritoryPolicyInput,
} from '../utils/entidadeTerritoryPolicy'
import { isPrefeituraEntidadeTipo, resolveAceitaPacientesOutrosMunicipios } from '../config/adminEntidadeTipo'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPatientTerritoryPolicy,
  type UbtPatientTerritoryPolicy,
} from '../lib/services/ubt/pacientes'

export type { PatientAddressTerritoryRequirement } from '../components/dashboard/PatientAddressStep'

export function resolveUbtPatientAddressTerritoryRequirement(
  policy: PatientTerritoryPolicyInput | null | undefined,
) {
  return resolvePatientAddressTerritoryRequirement(policy)
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
        const tipoEntidade = user.entidadeTipo
        setPolicy({
          municipio: user.municipio,
          uf: user.uf,
          aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
            tipoEntidade,
            false,
          ),
          tipoEntidade,
        })
      } else {
        setPolicy(null)
      }
      setLoadError(
        isPrefeituraEntidadeTipo(user?.entidadeTipo)
          ? 'Não foi possível confirmar a política do contrato. Aplicando restrição do município da entidade.'
          : 'Não foi possível confirmar a política do contrato.',
      )
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
    allowsOtherMunicipalities: patientContractAllowsOtherMunicipalities(policy),
    isLoading,
    loadError,
    reload,
  }
}
