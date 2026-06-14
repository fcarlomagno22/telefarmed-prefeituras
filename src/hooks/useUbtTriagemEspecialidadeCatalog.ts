import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTriagemEspecialidadesForDate } from '../data/triagemEspecialidadesMock'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtTriagemEspecialidadeCatalog,
  isUbtTriagemApiError,
  type UbtTriagemEspecialidadeCatalog,
} from '../lib/services/ubt/triagem'
import { parseDateKey, toDateKey } from '../utils/agendaDate'

export function useUbtTriagemEspecialidadeCatalog(enabled = true, selectedDate?: Date) {
  const ubtAuth = useOptionalUbtAuth()
  const [catalog, setCatalog] = useState<UbtTriagemEspecialidadeCatalog | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const resolvedDate = selectedDate ?? new Date()

  const dateKey = useMemo(() => toDateKey(resolvedDate), [resolvedDate])

  const fallbackSpecialties = useMemo(
    () => getTriagemEspecialidadesForDate(parseDateKey(dateKey)),
    [dateKey],
  )

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = ubtAuth?.getAccessToken() ?? 'mock-demo-token'
      const next = await fetchUbtTriagemEspecialidadeCatalog(token, dateKey)
      setCatalog(next)
      setLoadError(null)
    } catch (error) {
      const message = isUbtTriagemApiError(error)
        ? error.message
        : 'Não foi possível carregar as especialidades do contrato.'
      setCatalog(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [dateKey, ubtAuth])

  useEffect(() => {
    if (!enabled || ubtAuth?.isBootstrapping) return
    void reload()
  }, [enabled, ubtAuth?.isBootstrapping, reload])

  const specialties =
    catalog?.specialties && catalog.specialties.length > 0
      ? catalog.specialties
      : fallbackSpecialties

  return {
    catalog,
    specialties,
    dateKey: catalog?.date ?? dateKey,
    isLoading,
    loadError,
    reload,
  }
}
