import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import type { AgendaDaySummary, AppointmentStatus, DayAppointment } from '../data/agendaMock'
import type { AgendaDoctorShiftRecord } from '../data/agendaDoctorShiftMock'
import { checkInUbtFila } from '../lib/services/ubt/triagem'
import {
  cancelUbtAgendaConsulta,
  confirmUbtAgendaRecepcao,
  fetchUbtAgendaDay,
  fetchUbtAgendaDoctorShifts,
  fetchUbtAgendaHistory,
  fetchUbtAgendaMonthIndicators,
  isUbtAgendaApiError,
  markUbtAgendaFalta,
  updateUbtAgendaConsulta,
  type UbtAgendaDoctorShiftApi,
} from '../lib/services/ubt/agenda'
import { toDateKey } from '../utils/agendaDate'

function mapDoctorShiftToRecord(shift: UbtAgendaDoctorShiftApi): AgendaDoctorShiftRecord {
  return {
    id: shift.doctorId,
    name: shift.doctorName,
    specialty: shift.specialtyName,
    avatarUrl: '',
    loginAt: shift.startTime,
    logoutAt: shift.endTime,
    hourlyAttendance: [],
    totalPatients: 0,
    ratings: {
      average: 0,
      totalReviews: 0,
      byStars: [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
      ],
    },
  }
}

export function useUbtAgendaPage(selectedDate: Date) {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = useUbtAuth()
  const dateKey = toDateKey(selectedDate)

  const [appointments, setAppointments] = useState<DayAppointment[]>([])
  const [summary, setSummary] = useState<AgendaDaySummary>({
    total: 0,
    completed: 0,
    inProgress: 0,
    waiting: 0,
    scheduled: 0,
    noShows: 0,
    attendanceRate: 0,
  })
  const [operationalClimate, setOperationalClimate] = useState<
    ReturnType<typeof useUbtAgendaPage>['operationalClimate']
  >({ hourlySlots: [] })
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof fetchUbtAgendaHistory>>
  >([])
  const [monthDates, setMonthDates] = useState<Set<string>>(new Set())
  const [doctorShifts, setDoctorShifts] = useState<AgendaDoctorShiftRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null)

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    const token = getAccessToken()
    if (!token) return

    if (!options?.silent) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [day, historyData, shifts] = await Promise.all([
        fetchUbtAgendaDay(token, dateKey),
        fetchUbtAgendaHistory(token, dateKey),
        fetchUbtAgendaDoctorShifts(token, dateKey),
      ])

      setAppointments(
        day.appointments.map((appointment) => ({
          ...appointment,
          specialtyId:
            appointment.specialtyId ??
            (appointment as DayAppointment & { especialidadeId?: string }).especialidadeId,
        })),
      )
      setSummary(day.summary)
      setOperationalClimate(day.operationalClimate)
      setHistory(historyData)
      setDoctorShifts(shifts.map(mapDoctorShiftToRecord))
    } catch (error) {
      const message = isUbtAgendaApiError(error)
        ? error.message
        : 'Não foi possível carregar a agenda.'
      setLoadError(message)
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }, [dateKey, getAccessToken])

  const reloadMonthIndicators = useCallback(
    async (year: number, month: number) => {
      const token = getAccessToken()
      if (!token) return
      try {
        const dates = await fetchUbtAgendaMonthIndicators(token, year, month)
        setMonthDates(dates)
      } catch {
        // indicadores do calendário são auxiliares
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
    void reloadMonthIndicators(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
  }, [isAuthenticated, isBootstrapping, reload, reloadMonthIndicators, selectedDate])

  const hasAppointmentsOnDate = useCallback(
    (date: Date) => monthDates.has(toDateKey(date)),
    [monthDates],
  )

  const runMutation = useCallback(
    async (appointmentId: string, action: () => Promise<void>) => {
      setUpdatingAppointmentId(appointmentId)
      setIsMutating(true)
      try {
        await action()
        await reload({ silent: true })
        await reloadMonthIndicators(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
      } finally {
        setIsMutating(false)
        setUpdatingAppointmentId(null)
      }
    },
    [reload, reloadMonthIndicators, selectedDate],
  )

  const cancelAppointment = useCallback(
    async (appointment: DayAppointment) => {
      const token = getAccessToken()
      if (!token) return
      await runMutation(appointment.id, async () => {
        await cancelUbtAgendaConsulta(token, appointment.id)
      })
    },
    [getAccessToken, runMutation],
  )

  const markNoShowAppointment = useCallback(
    async (appointment: DayAppointment) => {
      const token = getAccessToken()
      if (!token) return
      await runMutation(appointment.id, async () => {
        await markUbtAgendaFalta(token, appointment.id)
      })
    },
    [getAccessToken, runMutation],
  )

  const patchAppointment = useCallback(
    async (appointmentId: string, patch: Partial<DayAppointment>) => {
      const token = getAccessToken()
      if (!token) return

      await runMutation(appointmentId, async () => {
        const { updateUbtAgendaConsulta } = await import('../lib/services/ubt/agenda')
        await updateUbtAgendaConsulta(token, appointmentId, {
          hora: patch.time,
          especialidadeId: undefined,
          status: patch.status,
        })
      })
    },
    [getAccessToken, runMutation],
  )

  const addAppointment = useCallback((appointment: DayAppointment) => {
    setAppointments((prev) =>
      [...prev, appointment].sort((a, b) => a.time.localeCompare(b.time, 'pt-BR')),
    )
    void reload({ silent: true })
  }, [reload])

  const checkInToFila = useCallback(
    async (appointmentId: string) => {
      const token = getAccessToken()
      if (!token) return
      await checkInUbtFila(token, appointmentId)
    },
    [getAccessToken],
  )

  const confirmArrival = useCallback(
    async (appointment: DayAppointment) => {
      if (appointment.status === 'realizado' || appointment.status === 'faltou') return
      const token = getAccessToken()
      if (!token) return

      await runMutation(appointment.id, async () => {
        await confirmUbtAgendaRecepcao(token, appointment.id)
        await checkInUbtFila(token, appointment.id)
      })
    },
    [getAccessToken, runMutation],
  )

  const changeAppointmentStatus = useCallback(
    async (appointment: DayAppointment, status: AppointmentStatus) => {
      const token = getAccessToken()
      if (!token) return

      await runMutation(appointment.id, async () => {
        await updateUbtAgendaConsulta(token, appointment.id, { status })
      })
    },
    [getAccessToken, runMutation],
  )

  const unitLabel = useMemo(
    () => user?.unidadeUbtNome?.split('—')[0]?.trim() ?? user?.unidadeUbtNome ?? 'Unidade UBT',
    [user?.unidadeUbtNome],
  )

  return {
    user,
    unitLabel,
    appointments,
    summary,
    operationalClimate,
    history,
    monthDates,
    doctorShifts,
    isLoading,
    loadError,
    isMutating,
    updatingAppointmentId,
    reload,
    reloadMonthIndicators,
    hasAppointmentsOnDate,
    cancelAppointment,
    markNoShowAppointment,
    patchAppointment,
    addAppointment,
    confirmArrival,
    changeAppointmentStatus,
    checkInToFila,
  }
}
