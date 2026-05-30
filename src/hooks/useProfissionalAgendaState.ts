import { useCallback, useEffect, useMemo, useState } from 'react'
import { PROFISSIONAL_LOGGED_DOCTOR_ID } from '../config/profissionalConfig'
import { getActiveNotices } from '../data/profissionalAgendaNotices'
import {
  computeShiftStatsFromQueue,
  ensureProfissionalQueueSeeded,
  enterProfissionalShift,
  getEndedShiftIds,
  getProfissionalQueue,
  readActiveShiftSession,
  PROFISSIONAL_QUEUE_UPDATED_EVENT,
} from '../data/profissionalQueueStore'
import type { ProfissionalShift } from '../types/profissionalAgenda'
import { addCalendarMonths, CALENDAR_MONTH_LABELS, isSameCalendarMonth, startOfMonth } from '../utils/calendar'
import { parseDateKey, toDateKey } from '../utils/agendaDate'
import { getProfissionalShiftsForDoctor } from '../utils/profissional/buildProfissionalShifts'

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

function enrichShiftStats(shift: ProfissionalShift): ProfissionalShift {
  ensureProfissionalQueueSeeded(shift)
  const queue = getProfissionalQueue(shift.id)
  return { ...shift, stats: computeShiftStatsFromQueue(queue) }
}

export function useProfissionalAgendaState() {
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()))
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => startOfMonth(new Date()))
  const [agendaTab, setAgendaTab] = useState<ProfissionalAgendaTab>('dia')
  const [revision, setRevision] = useState(0)

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }
    window.addEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
  }, [refresh])

  const activeSession = useMemo(() => readActiveShiftSession(), [revision])
  const activeShiftId = activeSession?.endedAt ? null : activeSession?.shiftId ?? null
  const endedShiftIds = useMemo(() => getEndedShiftIds(), [revision])

  const shifts = useMemo(() => {
    const base = getProfissionalShiftsForDoctor(PROFISSIONAL_LOGGED_DOCTOR_ID, {
      activeShiftId,
      endedShiftIds,
    })
    return base.map(enrichShiftStats)
  }, [activeShiftId, endedShiftIds, revision])

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

  const notices = useMemo(() => getActiveNotices(), [])

  const shiftCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const shift of shifts) {
      map.set(shift.dateKey, (map.get(shift.dateKey) ?? 0) + 1)
    }
    return map
  }, [shifts])

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
      if (!shift) return
      ensureProfissionalQueueSeeded(shift)
      enterProfissionalShift(shiftId)
      setSelectedDateKey(shift.dateKey)
      setAgendaTab('fila')
      refresh()
    },
    [refresh, shifts],
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
    activeShift,
    activeSession,
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
  }
}
