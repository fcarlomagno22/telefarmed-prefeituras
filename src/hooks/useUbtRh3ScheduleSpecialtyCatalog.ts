import { useCallback, useEffect, useState } from 'react'
import type { SpecialtyOption } from '../components/dashboard/SpecialtySelectionStep'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchRh3ScheduleSpecialties,
  isUbtRh3ApiError,
} from '../lib/services/ubt/rh3'

export function useUbtRh3ScheduleSpecialtyCatalog(enabled = true) {
  const ubtAuth = useOptionalUbtAuth()
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = ubtAuth?.getAccessToken() ?? 'mock-demo-token'
      const response = await fetchRh3ScheduleSpecialties(token)
      setSpecialties(
        response.specialties.map((item) => ({
          id: item.id,
          name: item.name,
          available: true,
          origemAtendimento: 'mt' as const,
          rh3EspecialidadId: item.rh3EspecialidadId,
        })),
      )
      setLoadError(null)
    } catch (error) {
      const message = isUbtRh3ApiError(error)
        ? error.message
        : 'Não foi possível carregar as especialidades terceirizadas.'
      setSpecialties([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [ubtAuth])

  useEffect(() => {
    if (!enabled || ubtAuth?.isBootstrapping) return
    void reload()
  }, [enabled, ubtAuth?.isBootstrapping, reload])

  return {
    specialties,
    isLoading,
    loadError,
    reload,
  }
}
