import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { usePrefeituraUbtOptionsQuery } from '../lib/query/ubtOptionsQueries'
import { buildGestaoUrl } from '../config/tenantHost'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import type { PrefeituraCredentialUser } from '../config/prefeituraCredenciaisConfig'
import {
  fetchPrefeituraEntitySummary,
  fetchPrefeituraGestorCredentials,
  fetchPrefeituraPortalCredentials,
  isPrefeituraCredenciaisApiError,
} from '../lib/services/prefeitura/credenciais'

export function usePrefeituraAccessCredentialsPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const ubtOptionsQuery = usePrefeituraUbtOptionsQuery(
    getAccessToken,
    isAuthenticated && !isBootstrapping,
  )
  const [operatorRows, setOperatorRows] = useState<AdminOperatorRow[]>([])
  const [gestorRows, setGestorRows] = useState<PrefeituraCredentialUser[]>([])
  const [contractingEntityOptions, setContractingEntityOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [entitySlug, setEntitySlug] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const ubtOptions = ubtOptionsQuery.data ?? []

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [users, gestores, entity] = await Promise.all([
        fetchPrefeituraPortalCredentials(token),
        fetchPrefeituraGestorCredentials(token),
        fetchPrefeituraEntitySummary(token),
      ])

      setOperatorRows(users)
      setGestorRows(gestores)
      setContractingEntityOptions([{ value: entity.id, label: entity.label }])
      setEntitySlug(entity.slug ?? '')
      await ubtOptionsQuery.refetch()
    } catch (error) {
      const message = isPrefeituraCredenciaisApiError(error)
        ? error.message
        : 'Não foi possível carregar as credenciais.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, ubtOptionsQuery])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const pageLoading = isLoading || isBootstrapping || ubtOptionsQuery.isPending
  const pageError =
    loadError ??
    (ubtOptionsQuery.isError ? 'Não foi possível carregar as unidades UBT.' : null)

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
      isLoading: pageLoading,
      loadError: pageError,
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
      pageLoading,
      pageError,
      reload,
      afterMutation,
      getAccessToken,
    ],
  )
}
