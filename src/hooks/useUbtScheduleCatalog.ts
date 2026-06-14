import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import type { ScheduleDoctor, ScheduleTimeSlot } from '../data/scheduleDoctorsMock'
import {
  fetchUbtAgendaDoctorOverview,
  fetchUbtAgendaDoctorSlots,
  fetchUbtAgendaMedicos,
  fetchUbtAgendaSpecialtyAvailability,
  fetchUbtAgendaSpecialtySlotCount,
  type UbtAgendaSpecialtyAvailability,
} from '../lib/services/ubt/agenda'
import { addDays, toDateKey } from '../utils/agendaDate'

const doctorsCache = new Map<string, ScheduleDoctor[]>()
const slotsCache = new Map<string, ScheduleTimeSlot[]>()
const overviewCache = new Map<
  string,
  Array<{ date: string; worksThisDay: boolean; availableSlots: number }>
>()
const specialtyCountCache = new Map<string, number>()
const specialtyAvailabilityCache = new Map<string, UbtAgendaSpecialtyAvailability[]>()

export function invalidateUbtScheduleCatalogCache() {
  doctorsCache.clear()
  slotsCache.clear()
  overviewCache.clear()
  specialtyCountCache.clear()
  specialtyAvailabilityCache.clear()
}

export function useUbtScheduleCatalog() {
  const { getAccessToken } = useUbtAuth()

  const cacheKey = (...parts: string[]) => parts.join('|')

  const getDoctorsForSpecialty = useCallback(
    async (specialtyId: string, date: string) => {
      const key = cacheKey('doctors', specialtyId, date)
      const cached = doctorsCache.get(key)
      if (cached) return cached

      const token = getAccessToken()
      if (!token) return []

      const doctors = await fetchUbtAgendaMedicos(token, { specialtyId, date })
      doctorsCache.set(key, doctors)
      return doctors
    },
    [getAccessToken],
  )

  const getDoctorAvailableSlots = useCallback(
    async (doctorId: string, date: string) => {
      const key = cacheKey('slots', doctorId, date)
      const cached = slotsCache.get(key)
      if (cached) return cached

      const token = getAccessToken()
      if (!token) return []

      const slots = await fetchUbtAgendaDoctorSlots(token, doctorId, date)
      slotsCache.set(key, slots)
      return slots
    },
    [getAccessToken],
  )

  const getDoctorScheduleOverview = useCallback(
    async (doctorId: string, fromDate: Date, dayCount: number) => {
      const from = toDateKey(fromDate)
      const key = cacheKey('overview', doctorId, from, String(dayCount))
      const cached = overviewCache.get(key)
      if (cached) {
        return cached.map((item) => ({
          date: new Date(`${item.date}T12:00:00`),
          worksThisDay: item.worksThisDay,
          availableSlots: item.availableSlots,
        }))
      }

      const token = getAccessToken()
      if (!token) return []

      const overview = await fetchUbtAgendaDoctorOverview(token, doctorId, from, dayCount)
      overviewCache.set(key, overview)
      return overview.map((item) => ({
        date: new Date(`${item.date}T12:00:00`),
        worksThisDay: item.worksThisDay,
        availableSlots: item.availableSlots,
      }))
    },
    [getAccessToken],
  )

  const countSpecialtyAvailableSlotsOnDay = useCallback(
    async (specialtyId: string, date: Date) => {
      const dateKey = toDateKey(date)
      const key = cacheKey('specialty-count', specialtyId, dateKey)
      const cached = specialtyCountCache.get(key)
      if (cached !== undefined) return cached

      const token = getAccessToken()
      if (!token) return 0

      const count = await fetchUbtAgendaSpecialtySlotCount(token, specialtyId, dateKey)
      specialtyCountCache.set(key, count)
      return count
    },
    [getAccessToken],
  )

  const getSpecialtyAvailabilityForDay = useCallback(
    async (date: Date) => {
      const dateKey = toDateKey(date)
      const key = cacheKey('specialty-availability', dateKey)
      const cached = specialtyAvailabilityCache.get(key)
      if (cached) return cached

      const token = getAccessToken()
      if (!token) return []

      const specialties = await fetchUbtAgendaSpecialtyAvailability(token, dateKey)
      specialtyAvailabilityCache.set(key, specialties)
      return specialties
    },
    [getAccessToken],
  )

  const invalidateCache = invalidateUbtScheduleCatalogCache

  return useMemo(
    () => ({
      getDoctorsForSpecialty,
      getDoctorAvailableSlots,
      getDoctorScheduleOverview,
      countSpecialtyAvailableSlotsOnDay,
      getSpecialtyAvailabilityForDay,
      invalidateCache,
    }),
    [
      getDoctorsForSpecialty,
      getDoctorAvailableSlots,
      getDoctorScheduleOverview,
      countSpecialtyAvailableSlotsOnDay,
      getSpecialtyAvailabilityForDay,
    ],
  )
}

export function getNextScheduleDays(count: number, fromDate: Date): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(fromDate, index))
}

export function useScheduleDoctorsForSpecialty(specialtyId: string, date: Date) {
  const catalog = useUbtScheduleCatalog()
  const [doctors, setDoctors] = useState<ScheduleDoctor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!specialtyId) {
      setDoctors([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    void catalog
      .getDoctorsForSpecialty(specialtyId, toDateKey(date))
      .then((result) => {
        if (!cancelled) setDoctors(result)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [catalog, date, specialtyId])

  const getDoctorById = useCallback(
    (doctorId: string) => doctors.find((doctor) => doctor.id === doctorId),
    [doctors],
  )

  return { doctors, isLoading, getDoctorById, catalog }
}

export function useSpecialtyAvailabilityMap(selectedDate: Date) {
  const catalog = useUbtScheduleCatalog()
  const [specialties, setSpecialties] = useState<UbtAgendaSpecialtyAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    void catalog.getSpecialtyAvailabilityForDay(selectedDate).then((result) => {
      if (cancelled) return
      setSpecialties(result)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [catalog, selectedDate])

  const availabilityById = useMemo(
    () => new Map(specialties.map((item) => [item.id, item.availableSlots])),
    [specialties],
  )

  return { specialties, availabilityById, isLoading }
}
