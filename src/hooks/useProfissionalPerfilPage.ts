import { useCallback, useEffect, useState } from 'react'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type { ProfissionalPerfil } from '../types/profissionalPerfil'
import {
  fetchProfissionalPerfil,
  isProfissionalPerfilApiError,
  patchProfissionalPerfil,
} from '../lib/services/profissional/perfil'
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const PERFIL_CACHE_KEY = 'profissional:perfil'

export function useProfissionalPerfilPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const [profile, setProfile] = useState<ProfissionalPerfil | null>(() => {
    return readPortalPageCache<ProfissionalPerfil>(PERFIL_CACHE_KEY) ?? null
  })
  const [isLoading, setIsLoading] = useState(shouldBlockPortalPageWithCache(PERFIL_CACHE_KEY))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    if (shouldBlockPortalPageWithCache(PERFIL_CACHE_KEY)) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const data = await fetchProfissionalPerfil(token)
      setProfile(data)
      writePortalPageCache(PERFIL_CACHE_KEY, data)
    } catch (error) {
      const message = isProfissionalPerfilApiError(error)
        ? error.message
        : 'Não foi possível carregar seu perfil.'
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

  const saveProfile = useCallback(
    async (payload: Record<string, unknown>) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsSaving(true)
      try {
        const updated = await patchProfissionalPerfil(token, payload)
        setProfile(updated)
        writePortalPageCache(PERFIL_CACHE_KEY, updated)
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [getAccessToken],
  )

  return {
    profile,
    isLoading,
    loadError,
    isSaving,
    reload,
    saveProfile,
  }
}
