import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  computeShiftStatsFromQueue,
  endProfissionalShift,
  enterProfissionalShift,
  getEndedShiftIds,
  getProfissionalQueue,
  readActiveShiftSession,
  syncAllProfissionalQueuesFromApi,
  writeActiveShiftSession,
  PROFISSIONAL_QUEUE_UPDATED_EVENT,
} from '../data/profissionalQueueStore'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import {
  enterProfissionalAgendaPlantao,
  fetchProfissionalAgendaOverview,
  isProfissionalAgendaApiError,
  type ProfissionalAgendaPlantaoApi,
} from '../lib/services/profissional/agenda'
import { isBackendApiEnabled } from '../lib/api/config'
import type { ProfissionalAgendaNotice, ProfissionalShift } from '../types/profissionalAgenda'
import { addCalendarMonths, CALENDAR_MONTH_LABELS, isSameCalendarMonth, startOfMonth } from '../utils/calendar'
import { parseDateKey, toDateKey } from '../utils/agendaDate'
import {
  mapConsultaApiToQueuePatient,
  mapPlantoesApiToProfissionalShifts,
} from '../utils/profissional/mapProfissionalAgendaApi'
import { canEnterProfissionalShift } from '../utils/profissional/profissionalShiftTiming'
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

export type ProfissionalAgendaTab = 'dia' | 'fila'

function isInMonth(dateKey: string, monthRef: Date) {
  const date = parseDateKey(dateKey)
  return isSameCalendarMonth(date, monthRef)
}

function buildMonthWeekDistribution(
  shifts: ProfissionalShift[],
  monthRef: Date,
): number[] {
  const weeks = [0, 0, 0, 0, 0, 0]
  for (const shift of shifts) {
    if (!isInMonth(shift.dateKey, monthRef)) continue
    const day = parseDateKey(shift.dateKey).getDate()
    const weekIndex = Math.min(5, Math.floor((day - 1) / 7))
    weeks[weekIndex] += 1
  }
  return weeks
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function buildOverviewRange(calendarViewMonth: Date): { dateFrom: string; dateTo: string } {
  const monthStart = startOfMonth(calendarViewMonth)
  const monthEnd = endOfMonth(calendarViewMonth)
  return {
    dateFrom: toDateKey(addDays(monthStart, -7)),
    dateTo: toDateKey(addDays(monthEnd, 14)),
  }
}

function enrichShiftStats(shift: ProfissionalShift): ProfissionalShift {
  const queue = getProfissionalQueue(shift.id)
  if (queue.length === 0) return shift
  return { ...shift, stats: computeShiftStatsFromQueue(queue) }
}

type ActiveAgendaSession = {
  shiftId: string
  plantaoId: string
  enteredAt: string
  endedAt?: string
}

function readActiveSessionFromOverview(
  overview: Awaited<ReturnType<typeof fetchProfissionalAgendaOverview>>,
): ActiveAgendaSession | null {
  if (!('activeSession' in overview)) return null
  return (overview as { activeSession?: ActiveAgendaSession | null }).activeSession ?? null
}

function applyAgendaOverviewSideEffects(
  overview: Awaited<ReturnType<typeof fetchProfissionalAgendaOverview>>,
) {
  syncAllProfissionalQueuesFromApi(
    overview.consultas.map((consulta) => mapConsultaApiToQueuePatient(consulta)),
    overview.plantoes.map((plantao) => plantao.shiftId),
  )

  if (!isBackendApiEnabled()) return

  const activeSession = readActiveSessionFromOverview(overview)
  const local = readActiveShiftSession()
  if (activeSession && !activeSession.endedAt) {
    writeActiveShiftSession({
      shiftId: activeSession.shiftId,
      plantaoId: activeSession.plantaoId,
      enteredAt: activeSession.enteredAt,
    })
  } else if (local && !local.endedAt) {
    const plantaoId = local.plantaoId ?? local.shiftId
    const plantao = overview.plantoes.find((item) => item.plantaoId === plantaoId)
    endProfissionalShift({
      atendidos: plantao?.stats.atendidos ?? 0,
      naoCompareceu: 0,
      desistiu: 0,
      tempoMedioMin: plantao?.stats.tempoMedioMin ?? 0,
      duracaoPlantaoMin: Math.max(
        1,
        Math.round((Date.now() - new Date(local.enteredAt).getTime()) / 60_000),
      ),
    })
  }
}

export function useProfissionalAgendaState() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()))
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => startOfMonth(new Date()))
  const [agendaTab, setAgendaTab] = useState<ProfissionalAgendaTab>('dia')
  const [revision, setRevision] = useState(0)

  const { dateFrom, dateTo } = buildOverviewRange(calendarViewMonth)

  const query = useQuery({
    queryKey: queryKeys.profissionalAgenda(dateFrom, dateTo),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalAgendaOverview(token, { dateFrom, dateTo })
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const plantoesApi = query.data?.plantoes ?? []
  const shiftCountByDateApi = query.data?.shiftCountByDate ?? {}
  const notices = query.data?.notices ?? []
  const activeSessionApi = query.data ? readActiveSessionFromOverview(query.data) : null

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  const reload = useCallback(async () => {
    await query.refetch()
  }, [query])

  useEffect(() => {
    if (!query.data) return
    applyAgendaOverviewSideEffects(query.data)
    refresh()
  }, [query.data, refresh])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }
    window.addEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
  }, [refresh])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) return
    if (!activeSessionApi || activeSessionApi.endedAt) return

    const interval = window.setInterval(() => {
      void reload()
    }, 30_000)

    return () => window.clearInterval(interval)
  }, [activeSessionApi, isAuthenticated, isBootstrapping, reload])

  const activeSession = useMemo(() => readActiveShiftSession(), [revision])
  const activeShiftId = activeSession?.endedAt ? null : activeSession?.shiftId ?? null
  const endedShiftIds = useMemo(() => getEndedShiftIds(), [revision])

  const shifts = useMemo(() => {
    const base = mapPlantoesApiToProfissionalShifts(plantoesApi as ProfissionalAgendaPlantaoApi[], {
      activeShiftId,
      endedShiftIds,
    })
    return base.map(enrichShiftStats)
  }, [plantoesApi, activeShiftId, endedShiftIds, revision])

  const selectedShifts = useMemo(
    () => shifts.filter((shift) => shift.dateKey === selectedDateKey),
    [shifts, selectedDateKey],
  )

  const todayKey = toDateKey(new Date())
  const todayShifts = useMemo(
    () => shifts.filter((shift) => shift.dateKey === todayKey),
    [shifts, todayKey],
  )

  const activeShift = useMemo(
    () => (activeShiftId ? shifts.find((shift) => shift.id === activeShiftId) : undefined),
    [activeShiftId, shifts],
  )

  const shiftCountByDate = useMemo(() => {
    const map = new Map<string, number>(Object.entries(shiftCountByDateApi))
    for (const shift of shifts) {
      if (!map.has(shift.dateKey)) {
        map.set(shift.dateKey, (map.get(shift.dateKey) ?? 0) + 1)
      }
    }
    return map
  }, [shiftCountByDateApi, shifts])

  const monthShifts = useMemo(
    () => shifts.filter((shift) => isInMonth(shift.dateKey, calendarViewMonth)),
    [shifts, calendarViewMonth],
  )

  const monthShiftCount = monthShifts.length
  const monthTitularCount = monthShifts.filter((shift) => shift.role === 'titular').length
  const monthReservaCount = monthShifts.filter((shift) => shift.role === 'reserva').length
  const monthWeekDistribution = useMemo(
    () => buildMonthWeekDistribution(monthShifts, calendarViewMonth),
    [monthShifts, calendarViewMonth],
  )

  const monthSummaryLabel = useMemo(() => {
    if (isSameCalendarMonth(calendarViewMonth, new Date())) return 'Este mês'
    return `${CALENDAR_MONTH_LABELS[calendarViewMonth.getMonth()]} ${calendarViewMonth.getFullYear()}`
  }, [calendarViewMonth])

  const goToPreviousCalendarMonth = useCallback(() => {
    setCalendarViewMonth((current) => addCalendarMonths(current, -1))
  }, [])

  const goToNextCalendarMonth = useCallback(() => {
    setCalendarViewMonth((current) => addCalendarMonths(current, 1))
  }, [])

  const goToTodayInCalendar = useCallback(() => {
    const today = new Date()
    setCalendarViewMonth(startOfMonth(today))
    setSelectedDateKey(toDateKey(today))
  }, [])

  const upcomingShifts = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return shifts
      .filter((shift) => parseDateKey(shift.dateKey) >= startOfToday)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 6)
  }, [shifts])

  const handleEnterShift = useCallback(
    (shiftId: string) => {
      const shift = shifts.find((item) => item.id === shiftId)
      if (!shift || !canEnterProfissionalShift(shift)) return

      const token = getAccessToken()
      if (isBackendApiEnabled() && token) {
        void enterProfissionalAgendaPlantao(token, shift.plantaoId)
          .then((session) => {
            if (session) {
              writeActiveShiftSession({
                shiftId: session.shiftId,
                plantaoId: session.plantaoId,
                enteredAt: session.enteredAt,
              })
            } else {
              enterProfissionalShift(shiftId, shift.plantaoId)
            }
            refresh()
          })
          .catch(() => {
            enterProfissionalShift(shiftId, shift.plantaoId)
            refresh()
          })
      } else {
        enterProfissionalShift(shiftId, shift.plantaoId)
        refresh()
      }

      setSelectedDateKey(shift.dateKey)
      setAgendaTab('fila')
    },
    [getAccessToken, refresh, shifts],
  )

  const selectedDateLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(parseDateKey(selectedDateKey))
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [selectedDateKey])

  return {
    selectedDateKey,
    setSelectedDateKey,
    calendarViewMonth,
    setCalendarViewMonth,
    goToPreviousCalendarMonth,
    goToNextCalendarMonth,
    goToTodayInCalendar,
    agendaTab,
    setAgendaTab,
    selectedShifts,
    todayShifts,
    shifts,
    activeShift,
    activeSession,
    activeSessionApi,
    notices,
    shiftCountByDate,
    monthShiftCount,
    monthTitularCount,
    monthReservaCount,
    monthWeekDistribution,
    monthSummaryLabel,
    upcomingShifts,
    selectedDateLabel,
    handleEnterShift,
    refresh,
    reload,
    isLoading: query.isPending,
    loadError: query.isError
      ? isProfissionalAgendaApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar a agenda.'
      : null,
  }
}
