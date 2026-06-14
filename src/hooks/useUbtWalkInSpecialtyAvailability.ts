import { useEffect, useMemo, useState } from 'react'
import { filterAvailableSlotsFromNow, countSpecialtyAvailableSlotsFromNow } from '../data/scheduleDoctorsMock'
import type { SpecialtyOption } from '../components/dashboard/SpecialtySelectionStep'
import { isBackendApiEnabled } from '../lib/api/config'
import { toDateKey } from '../utils/agendaDate'
import { useUbtScheduleCatalog } from './useUbtScheduleCatalog'
import { useUbtTriagemEspecialidadeCatalog } from './useUbtTriagemEspecialidadeCatalog'

function mapMockWalkInSpecialties(
  specialties: SpecialtyOption[],
  selectedDate: Date,
): SpecialtyOption[] {
  return specialties.map((item) => {
    const availableSlots = countSpecialtyAvailableSlotsFromNow(item.id, selectedDate)
    return {
      ...item,
      availableSlots,
      available: availableSlots > 0,
    }
  })
}

export function useUbtWalkInSpecialtyAvailability(enabled: boolean, selectedDate: Date) {
  const useApi = isBackendApiEnabled()
  const catalog = useUbtTriagemEspecialidadeCatalog(enabled, selectedDate)
  const scheduleCatalog = useUbtScheduleCatalog()
  const [refinedSpecialties, setRefinedSpecialties] = useState<SpecialtyOption[]>([])
  const [isRefining, setIsRefining] = useState(false)

  const dateKey = useMemo(() => toDateKey(selectedDate), [selectedDate])

  useEffect(() => {
    if (!enabled) {
      setRefinedSpecialties([])
      setIsRefining(false)
      return
    }

    if (catalog.isLoading) {
      setIsRefining(false)
      return
    }

    if (!useApi) {
      setRefinedSpecialties(mapMockWalkInSpecialties(catalog.specialties, selectedDate))
      setIsRefining(false)
      return
    }

    let cancelled = false
    setIsRefining(true)

    void (async () => {
      const next = await Promise.all(
        catalog.specialties.map(async (item) => {
          const doctors = await scheduleCatalog.getDoctorsForSpecialty(item.id, dateKey)
          let availableSlots = 0

          for (const doctor of doctors) {
            const slots = await scheduleCatalog.getDoctorAvailableSlots(doctor.id, dateKey)
            availableSlots += filterAvailableSlotsFromNow(slots).length
          }

          return {
            ...item,
            availableSlots,
            available: availableSlots > 0,
          }
        }),
      )

      if (!cancelled) {
        setRefinedSpecialties(next)
        setIsRefining(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    catalog.isLoading,
    catalog.specialties,
    dateKey,
    enabled,
    scheduleCatalog,
    selectedDate,
    useApi,
  ])

  const specialties = useApi
    ? refinedSpecialties
    : mapMockWalkInSpecialties(catalog.specialties, selectedDate)

  return {
    specialties,
    isLoading: catalog.isLoading || (useApi && isRefining && specialties.length === 0),
    loadError: catalog.loadError,
    reload: catalog.reload,
  }
}
