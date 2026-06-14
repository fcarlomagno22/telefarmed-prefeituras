import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../data/prefeituraAccessCredentialsMock'
import {
  fetchUbtPortalCredentials,
  isUbtCredenciaisApiError,
  type UbtCredentialsListQuery,
} from '../lib/services/ubt/credenciais'

export type UbtCredentialsListFilters = {
  search: string
  profile: string
  status: '' | 'ativo' | 'inativo'
}

export const defaultUbtCredentialsListFilters = (): UbtCredentialsListFilters => ({
  search: '',
  profile: '',
  status: '',
})

function toListQuery(filters: UbtCredentialsListFilters): UbtCredentialsListQuery | undefined {
  const query: UbtCredentialsListQuery = {}
  if (filters.search.trim()) query.search = filters.search.trim()
  if (filters.profile.trim()) query.profile = filters.profile.trim()
  if (filters.status) query.status = filters.status
  return Object.keys(query).length > 0 ? query : undefined
}

export function useUbtAccessCredentialsPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = useUbtAuth()
  const [operatorRows, setOperatorRows] = useState<AdminOperatorRow[]>([])
  const [canManage, setCanManage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UbtCredentialsListFilters>(defaultUbtCredentialsListFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const ubtOptions = useMemo<PrefeituraCredentialUbtOption[]>(() => {
    if (!user) return []
    return [
      {
        value: user.unidadeUbtId,
        label: user.unidadeUbtNome,
        ubtName: user.unidadeUbtNome,
        raKey: '',
        raLabel: '',
        contractingEntityId: user.entidadeContratanteId,
      },
    ]
  }, [user])

  const contractingEntityOptions = useMemo(() => {
    if (!user) return []
    return [
      {
        value: user.entidadeContratanteId,
        label: `${user.entidadeRazaoSocial} · ${user.municipio}/${user.uf}`,
      },
    ]
  }, [user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [filters.search])

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [debouncedSearch, filters],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const { users, canManage: manage } = await fetchUbtPortalCredentials(
        token,
        toListQuery(effectiveFilters),
      )
      setOperatorRows(users)
      setCanManage(manage)
    } catch (error) {
      const message = isUbtCredenciaisApiError(error)
        ? error.message
        : 'Não foi possível carregar as credenciais.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [effectiveFilters, getAccessToken])

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

  const profileOptions = useMemo(() => {
    const roles = new Set(operatorRows.map((row) => row.role).filter(Boolean))
    return [
      { value: '', label: 'Todas as funções' },
      ...Array.from(roles)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((role) => ({ value: role, label: role })),
    ]
  }, [operatorRows])

  return useMemo(
    () => ({
      operatorRows,
      setOperatorRows,
      ubtOptions,
      contractingEntityOptions,
      canManage,
      isLoading: isLoading || isBootstrapping,
      loadError,
      filters,
      setFilters,
      profileOptions,
      reload,
      afterMutation,
      getAccessToken,
    }),
    [
      operatorRows,
      ubtOptions,
      contractingEntityOptions,
      canManage,
      isLoading,
      isBootstrapping,
      loadError,
      filters,
      profileOptions,
      reload,
      afterMutation,
      getAccessToken,
    ],
  )
}
