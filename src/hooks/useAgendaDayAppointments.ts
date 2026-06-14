import { useCallback, useMemo, useState } from 'react'
import {
  buildAgendaDaySummary,
  buildAgendaOperationalClimate,
  getAgendaDayData,
  type DayAppointment,
} from '../data/agendaMock'
import { toDateKey } from '../utils/agendaDate'

function sortByTime(appointments: DayAppointment[]) {
  return [...appointments].sort((a, b) => a.time.localeCompare(b.time, 'pt-BR'))
}

export function useAgendaDayAppointments(selectedDate: Date) {
  const dateKey = toDateKey(selectedDate)
  const baseAppointments = useMemo(
    () => getAgendaDayData(selectedDate).appointments,
    [dateKey],
  )

  const [overridesByDateKey, setOverridesByDateKey] = useState<
    Record<string, DayAppointment[]>
  >({})

  const appointments = overridesByDateKey[dateKey] ?? baseAppointments

  const setAppointments = useCallback(
    (next: DayAppointment[]) => {
      setOverridesByDateKey((prev) => ({
        ...prev,
        [dateKey]: sortByTime(next),
      }))
    },
    [dateKey],
  )

  const summary = useMemo(() => buildAgendaDaySummary(appointments), [appointments])

  const operationalClimate = useMemo(
    () => buildAgendaOperationalClimate(appointments),
    [appointments],
  )

  const cancelAppointment = useCallback(
    (appointment: DayAppointment) => {
      setAppointments(appointments.filter((item) => item.id !== appointment.id))
    },
    [appointments, setAppointments],
  )

  const markNoShowAppointment = useCallback(
    (appointment: DayAppointment) => {
      setAppointments(
        appointments.map((item) =>
          item.id === appointment.id ? { ...item, status: 'faltou' } : item,
        ),
      )
    },
    [appointments, setAppointments],
  )

  const patchAppointment = useCallback(
    (appointmentId: string, patch: Partial<DayAppointment>) => {
      setAppointments(
        appointments.map((item) =>
          item.id === appointmentId ? { ...item, ...patch } : item,
        ),
      )
    },
    [appointments, setAppointments],
  )

  const addAppointment = useCallback(
    (appointment: DayAppointment) => {
      setAppointments([...appointments, appointment])
    },
    [appointments, setAppointments],
  )

  const confirmArrival = useCallback(
    (appointment: DayAppointment) => {
      if (appointment.status === 'realizado' || appointment.status === 'faltou') return
      patchAppointment(appointment.id, { status: 'aguardando' })
    },
    [patchAppointment],
  )

  return {
    appointments,
    summary,
    operationalClimate,
    cancelAppointment,
    markNoShowAppointment,
    patchAppointment,
    addAppointment,
    confirmArrival,
  }
}
