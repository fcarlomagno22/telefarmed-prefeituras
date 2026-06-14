import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../data/prefeituraAccessCredentialsMock'
import {
  fetchContractingEntities,
  fetchPortalCredentials,
  fetchUbtOptions,
  isCredenciaisApiError,
} from '../lib/services/admin/credenciais'

const SEARCH_DEBOUNCE_MS = 300

export function useAdminOperadoresPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [operatorRows, setOperatorRows] = useState<AdminOperatorRow[]>([])
  const [ubtOptions, setUbtOptions] = useState<PrefeituraCredentialUbtOption[]>([])
  const [contractingEntityOptions, setContractingEntityOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const listParams = {
        search: debouncedSearch || undefined,
        profile: profileFilter || undefined,
      }
      const [ubt, ubts, entities] = await Promise.all([
        fetchPortalCredentials(token, 'UBT', listParams),
        fetchUbtOptions(token),
        fetchContractingEntities(token),
      ])

      setOperatorRows(ubt)
      setUbtOptions(ubts)
      setContractingEntityOptions(
        entities.map((entity) => ({ value: entity.id, label: entity.label })),
      )
    } catch (error) {
      const message = isCredenciaisApiError(error)
        ? error.message
        : 'Não foi possível carregar os operadores.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, getAccessToken, profileFilter])

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

  return useMemo(
    () => ({
      operatorRows,
      setOperatorRows,
      ubtOptions,
      contractingEntityOptions,
      searchQuery,
      setSearchQuery,
      profileFilter,
      setProfileFilter,
      isLoading: isLoading || isBootstrapping,
      loadError,
      reload,
      afterMutation,
      getAccessToken,
    }),
    [
      operatorRows,
      ubtOptions,
      contractingEntityOptions,
      searchQuery,
      profileFilter,
      isLoading,
      isBootstrapping,
      loadError,
      reload,
      afterMutation,
      getAccessToken,
    ],
  )
}
