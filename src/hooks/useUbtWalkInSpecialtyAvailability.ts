import { useEffect, useMemo, useState } from 'react'
import { filterAvailableSlotsFromNow, countSpecialtyAvailableSlotsFromNow } from '../data/scheduleDoctorsMock'
import type { SpecialtyOption } from '../components/dashboard/SpecialtySelectionStep'
import {
  isMtSpecialty,
  isRh3ImmediateMtSpecialty,
} from '../config/rh3WalkInSpecialty'
import { isBackendApiEnabled } from '../lib/api/config'
import { toDateKey } from '../utils/agendaDate'
import { useUbtScheduleCatalog } from './useUbtScheduleCatalog'
import { useUbtTriagemEspecialidadeCatalog } from './useUbtTriagemEspecialidadeCatalog'

function mapWalkInSpecialtyOption(item: SpecialtyOption): SpecialtyOption {
  if (isMtSpecialty(item)) {
    const rh3Linked = Boolean(item.rh3EspecialidadId)

    if (isRh3ImmediateMtSpecialty(item)) {
      return {
        ...item,
        available: rh3Linked,
        availableSlots: rh3Linked ? 1 : 0,
        walkInBadge: rh3Linked ? 'immediate' : 'none',
      }
    }

    const slots = item.availableSlots ?? 0
    return {
      ...item,
      available: rh3Linked && slots > 0,
      availableSlots: slots,
      walkInBadge: slots > 0 ? 'slots' : 'none',
    }
  }

  const slots = item.availableSlots ?? 0
  return {
    ...item,
    available: slots > 0,
    availableSlots: slots,
    walkInBadge: slots > 0 ? 'slots' : 'none',
  }
}

function filterWalkInSpecialtiesForDay(specialties: SpecialtyOption[]): SpecialtyOption[] {
  return specialties.map(mapWalkInSpecialtyOption).filter((item) => item.available)
}

function mapMockWalkInSpecialties(
  specialties: SpecialtyOption[],
  selectedDate: Date,
): SpecialtyOption[] {
  const mapped = specialties.map((item) => {
    if (isMtSpecialty(item)) {
      return mapWalkInSpecialtyOption(item)
    }

    const availableSlots = countSpecialtyAvailableSlotsFromNow(item.id, selectedDate)
    return mapWalkInSpecialtyOption({
      ...item,
      availableSlots,
    })
  })

  return filterWalkInSpecialtiesForDay(mapped)
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
      const next = filterWalkInSpecialtiesForDay(
        await Promise.all(
          catalog.specialties.map(async (item) => {
            if (isMtSpecialty(item)) {
              return item
            }

            const doctors = await scheduleCatalog.getDoctorsForSpecialty(item.id, dateKey)
            let availableSlots = 0

            for (const doctor of doctors) {
              const slots = await scheduleCatalog.getDoctorAvailableSlots(doctor.id, dateKey)
              availableSlots += filterAvailableSlotsFromNow(slots).length
            }

            return {
              ...item,
              availableSlots,
            }
          }),
        ),
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
