import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTriagemEspecialidadesForDate } from '../data/triagemEspecialidadesMock'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtTriagemEspecialidadeCatalog,
  isUbtTriagemApiError,
  type UbtTriagemEspecialidadeCatalog,
} from '../lib/services/ubt/triagem'
import { parseDateKey, toDateKey } from '../utils/agendaDate'
import { queryKeys } from '../lib/query/keys'
import { DAY_CATALOG_GC_MS, DAY_CATALOG_STALE_MS } from '../lib/query/timings'

export function useUbtTriagemEspecialidadeCatalog(enabled = true, selectedDate?: Date) {
  const ubtAuth = useOptionalUbtAuth()
  const resolvedDate = selectedDate ?? new Date()
  const dateKey = useMemo(() => toDateKey(resolvedDate), [resolvedDate])

  const fallbackSpecialties = useMemo(
    () => getTriagemEspecialidadesForDate(parseDateKey(dateKey)),
    [dateKey],
  )

  const query = useQuery({
    queryKey: queryKeys.ubtTriagemSpecialties(dateKey),
    queryFn: async (): Promise<UbtTriagemEspecialidadeCatalog> => {
      const token = ubtAuth?.getAccessToken() ?? 'mock-demo-token'
      return fetchUbtTriagemEspecialidadeCatalog(token, dateKey)
    },
    enabled: enabled && !ubtAuth?.isBootstrapping,
    staleTime: DAY_CATALOG_STALE_MS,
    gcTime: DAY_CATALOG_GC_MS,
  })

  const catalog = query.data ?? null
  const specialties =
    catalog?.specialties && catalog.specialties.length > 0
      ? catalog.specialties
      : fallbackSpecialties

  return {
    catalog,
    specialties,
    dateKey: catalog?.date ?? dateKey,
    isLoading: query.isPending,
    loadError: query.isError
      ? isUbtTriagemApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar as especialidades do contrato.'
      : null,
    reload: async () => {
      await query.refetch()
    },
  }
}
