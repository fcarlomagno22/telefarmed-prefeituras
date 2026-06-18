import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { buildGestaoUrl } from '../config/tenantHost'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../data/prefeituraAccessCredentialsMock'
import type { PrefeituraCredentialUser } from '../config/prefeituraCredenciaisConfig'
import {
  fetchPrefeituraEntitySummary,
  fetchPrefeituraGestorCredentials,
  fetchPrefeituraPortalCredentials,
  fetchPrefeituraUbtOptions,
  isPrefeituraCredenciaisApiError,
} from '../lib/services/prefeitura/credenciais'

export function usePrefeituraAccessCredentialsPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [operatorRows, setOperatorRows] = useState<AdminOperatorRow[]>([])
  const [gestorRows, setGestorRows] = useState<PrefeituraCredentialUser[]>([])
  const [ubtOptions, setUbtOptions] = useState<PrefeituraCredentialUbtOption[]>([])
  const [contractingEntityOptions, setContractingEntityOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [entitySlug, setEntitySlug] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [users, gestores, options, entity] = await Promise.all([
        fetchPrefeituraPortalCredentials(token),
        fetchPrefeituraGestorCredentials(token),
        fetchPrefeituraUbtOptions(token),
        fetchPrefeituraEntitySummary(token),
      ])

      setOperatorRows(users)
      setGestorRows(gestores)
      setUbtOptions(options)
      setContractingEntityOptions([{ value: entity.id, label: entity.label }])
      setEntitySlug(entity.slug ?? '')
    } catch (error) {
      const message = isPrefeituraCredenciaisApiError(error)
        ? error.message
        : 'Não foi possível carregar as credenciais.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const afterMutation = useCallback(async () => {
    await reload()
  }, [reload])

  const gestorPortalLoginUrl = useMemo(
    () => (entitySlug.trim() ? buildGestaoUrl(entitySlug.trim()) : null),
    [entitySlug],
  )

  return useMemo(
    () => ({
      operatorRows,
      setOperatorRows,
      gestorRows,
      setGestorRows,
      ubtOptions,
      contractingEntityOptions,
      gestorPortalLoginUrl,
      isLoading: isLoading || isBootstrapping,
      loadError,
      reload,
      afterMutation,
      getAccessToken,
    }),
    [
      operatorRows,
      gestorRows,
      ubtOptions,
      contractingEntityOptions,
      gestorPortalLoginUrl,
      isLoading,
      isBootstrapping,
      loadError,
      reload,
      afterMutation,
      getAccessToken,
    ],
  )
}
