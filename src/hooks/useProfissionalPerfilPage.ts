import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type { ProfissionalPerfil } from '../types/profissionalPerfil'
import {
  fetchProfissionalPerfil,
  isProfissionalPerfilApiError,
  patchProfissionalPerfil,
} from '../lib/services/profissional/perfil'
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

export function useProfissionalPerfilPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.profissionalPerfil(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalPerfil(token)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const saveProfile = useCallback(
    async (payload: Record<string, unknown>) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsSaving(true)
      try {
        const updated = await patchProfissionalPerfil(token, payload)
        queryClient.setQueryData<ProfissionalPerfil>(queryKeys.profissionalPerfil(), updated)
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [getAccessToken, queryClient],
  )

  return {
    profile: query.data ?? null,
    isLoading: query.isPending,
    loadError: query.isError
      ? isProfissionalPerfilApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar seu perfil.'
      : null,
    isSaving,
    reload: async () => {
      await query.refetch()
    },
    saveProfile,
  }
}
